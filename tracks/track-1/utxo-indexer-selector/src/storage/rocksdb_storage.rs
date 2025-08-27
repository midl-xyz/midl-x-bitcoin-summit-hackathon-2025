use anyhow::{anyhow, Result};
use bitcoin::OutPoint;
use bitcoin::hashes::Hash;
use rocksdb::{DB, Options, WriteBatch};
use serde::{Deserialize, Serialize};
use std::path::Path;
use tracing::{debug, info, warn};

use crate::config::StorageConfig;
use crate::types::{UtxoEntry, IndexStats, UtxoQuery};

// Column family names
const CF_UTXOS: &str = "utxos";
const CF_STATS: &str = "stats";
const CF_HEIGHT_INDEX: &str = "height_index";
const CF_AMOUNT_INDEX: &str = "amount_index";

pub struct RocksDbStorage {
    db: DB,
}

impl RocksDbStorage {
    pub fn new(config: &StorageConfig) -> Result<Self> {
        let mut opts = Options::default();
        opts.create_if_missing(true);
        opts.create_missing_column_families(true);
        
        // Performance tuning
        opts.set_max_open_files(1000);
        opts.set_use_fsync(false);
        opts.set_bytes_per_sync(1048576);
        opts.set_disable_auto_compactions(false);
        
        // Set cache size
        let cache_size = config.cache_size_mb * 1024 * 1024;
        opts.set_db_write_buffer_size((cache_size / 4) as usize);
        
        // Enable compression if configured
        if config.enable_compression {
            opts.set_compression_type(rocksdb::DBCompressionType::Lz4);
        }

        let cfs = vec![CF_UTXOS, CF_STATS, CF_HEIGHT_INDEX, CF_AMOUNT_INDEX];
        
        let db = DB::open_cf(&opts, &config.db_path, cfs)
            .map_err(|e| anyhow!("Failed to open RocksDB at {}: {}", config.db_path, e))?;

        info!("Opened RocksDB storage at {}", config.db_path);
        
        Ok(Self { db })
    }

    /// Store a UTXO
    pub fn store_utxo(&self, utxo: &UtxoEntry) -> Result<()> {
        let cf = self.db.cf_handle(CF_UTXOS)
            .ok_or_else(|| anyhow!("UTXOS column family not found"))?;

        let key = self.utxo_key(&utxo.outpoint);
        let value = bincode::serialize(utxo)
            .map_err(|e| anyhow!("Failed to serialize UTXO: {}", e))?;

        self.db.put_cf(&cf, key, value)
            .map_err(|e| anyhow!("Failed to store UTXO: {}", e))?;

        // Update indexes
        self.update_indexes(utxo, true)?;

        debug!("Stored UTXO: {:?}", utxo.outpoint);
        Ok(())
    }

    /// Remove a UTXO (when spent)
    pub fn remove_utxo(&self, outpoint: &OutPoint) -> Result<Option<UtxoEntry>> {
        let cf = self.db.cf_handle(CF_UTXOS)
            .ok_or_else(|| anyhow!("UTXOS column family not found"))?;

        let key = self.utxo_key(outpoint);
        
        // Get the UTXO before removing it
        let utxo = match self.db.get_cf(&cf, &key)? {
            Some(data) => {
                let utxo: UtxoEntry = bincode::deserialize(&data)
                    .map_err(|e| anyhow!("Failed to deserialize UTXO: {}", e))?;
                Some(utxo)
            }
            None => None,
        };

        if let Some(ref utxo_entry) = utxo {
            // Remove from main storage
            self.db.delete_cf(&cf, key)
                .map_err(|e| anyhow!("Failed to remove UTXO: {}", e))?;

            // Update indexes
            self.update_indexes(utxo_entry, false)?;

            debug!("Removed UTXO: {:?}", outpoint);
        }

        Ok(utxo)
    }

    /// Get a UTXO by outpoint
    pub fn get_utxo(&self, outpoint: &OutPoint) -> Result<Option<UtxoEntry>> {
        let cf = self.db.cf_handle(CF_UTXOS)
            .ok_or_else(|| anyhow!("UTXOS column family not found"))?;

        let key = self.utxo_key(outpoint);
        
        match self.db.get_cf(&cf, key)? {
            Some(data) => {
                let utxo: UtxoEntry = bincode::deserialize(&data)
                    .map_err(|e| anyhow!("Failed to deserialize UTXO: {}", e))?;
                Ok(Some(utxo))
            }
            None => Ok(None),
        }
    }

    /// Query UTXOs with filters
    pub fn query_utxos(&self, query: &UtxoQuery) -> Result<Vec<UtxoEntry>> {
        let cf = self.db.cf_handle(CF_UTXOS)
            .ok_or_else(|| anyhow!("UTXOS column family not found"))?;

        let mut utxos = Vec::new();
        let mut count = 0;
        let offset = query.offset.unwrap_or(0);
        let limit = query.limit.unwrap_or(1000);

        let iter = self.db.iterator_cf(&cf, rocksdb::IteratorMode::Start);
        
        for item in iter {
            let (_, value) = item?;
            let utxo: UtxoEntry = bincode::deserialize(&value)
                .map_err(|e| anyhow!("Failed to deserialize UTXO: {}", e))?;

            // Apply filters
            if !self.matches_query(&utxo, query) {
                continue;
            }

            // Apply offset
            if count < offset {
                count += 1;
                continue;
            }

            utxos.push(utxo);
            count += 1;

            // Apply limit
            if utxos.len() >= limit {
                break;
            }
        }

        debug!("Query returned {} UTXOs", utxos.len());
        Ok(utxos)
    }

    /// Get all UTXOs (use with caution)
    pub fn get_all_utxos(&self) -> Result<Vec<UtxoEntry>> {
        let cf = self.db.cf_handle(CF_UTXOS)
            .ok_or_else(|| anyhow!("UTXOS column family not found"))?;

        let mut utxos = Vec::new();
        let iter = self.db.iterator_cf(&cf, rocksdb::IteratorMode::Start);
        
        for item in iter {
            let (_, value) = item?;
            let utxo: UtxoEntry = bincode::deserialize(&value)
                .map_err(|e| anyhow!("Failed to deserialize UTXO: {}", e))?;
            utxos.push(utxo);
        }

        debug!("Retrieved {} total UTXOs", utxos.len());
        Ok(utxos)
    }

    /// Update index statistics
    pub fn update_stats(&self, stats: &IndexStats) -> Result<()> {
        let cf = self.db.cf_handle(CF_STATS)
            .ok_or_else(|| anyhow!("STATS column family not found"))?;

        let value = bincode::serialize(stats)
            .map_err(|e| anyhow!("Failed to serialize stats: {}", e))?;

        self.db.put_cf(&cf, b"current", value)
            .map_err(|e| anyhow!("Failed to store stats: {}", e))?;

        debug!("Updated index statistics");
        Ok(())
    }

    /// Get index statistics
    pub fn get_stats(&self) -> Result<Option<IndexStats>> {
        let cf = self.db.cf_handle(CF_STATS)
            .ok_or_else(|| anyhow!("STATS column family not found"))?;

        match self.db.get_cf(&cf, b"current")? {
            Some(data) => {
                let stats: IndexStats = bincode::deserialize(&data)
                    .map_err(|e| anyhow!("Failed to deserialize stats: {}", e))?;
                Ok(Some(stats))
            }
            None => Ok(None),
        }
    }

    /// Batch operations for better performance
    pub fn batch_store_utxos(&self, utxos: &[UtxoEntry]) -> Result<()> {
        let cf = self.db.cf_handle(CF_UTXOS)
            .ok_or_else(|| anyhow!("UTXOS column family not found"))?;

        let mut batch = WriteBatch::default();
        
        for utxo in utxos {
            let key = self.utxo_key(&utxo.outpoint);
            let value = bincode::serialize(utxo)
                .map_err(|e| anyhow!("Failed to serialize UTXO: {}", e))?;
            batch.put_cf(&cf, key, value);
        }

        self.db.write(batch)
            .map_err(|e| anyhow!("Failed to execute batch write: {}", e))?;

        info!("Batch stored {} UTXOs", utxos.len());
        Ok(())
    }

    /// Get database size info
    pub fn get_db_size_info(&self) -> Result<String> {
        match self.db.property_value("rocksdb.estimate-live-data-size") {
            Ok(Some(size)) => Ok(format!("Estimated DB size: {} bytes", size)),
            _ => Ok("DB size information not available".to_string()),
        }
    }

    // Helper methods

    fn utxo_key(&self, outpoint: &OutPoint) -> Vec<u8> {
        let mut key = Vec::new();
        key.extend_from_slice(&outpoint.txid.to_byte_array());
        key.extend_from_slice(&outpoint.vout.to_le_bytes());
        key
    }

    fn update_indexes(&self, utxo: &UtxoEntry, is_add: bool) -> Result<()> {
        // Height index
        if let Ok(height_cf) = self.db.cf_handle(CF_HEIGHT_INDEX)
            .ok_or_else(|| anyhow!("HEIGHT_INDEX column family not found")) {
            let height_key = format!("height_{}", utxo.block_height);
            let outpoint_key = self.utxo_key(&utxo.outpoint);
            
            if is_add {
                self.db.put_cf(&height_cf, height_key, outpoint_key)?;
            } else {
                self.db.delete_cf(&height_cf, height_key)?;
            }
        }

        // Amount index (for range queries)
        if let Ok(amount_cf) = self.db.cf_handle(CF_AMOUNT_INDEX)
            .ok_or_else(|| anyhow!("AMOUNT_INDEX column family not found")) {
            let amount_key = format!("amount_{:020}", utxo.output.value);
            let outpoint_key = self.utxo_key(&utxo.outpoint);
            
            if is_add {
                self.db.put_cf(&amount_cf, amount_key, outpoint_key)?;
            } else {
                self.db.delete_cf(&amount_cf, amount_key)?;
            }
        }

        Ok(())
    }

    fn matches_query(&self, utxo: &UtxoEntry, query: &UtxoQuery) -> bool {
        if let Some(min_amount) = query.min_amount {
            if utxo.output.value < min_amount {
                return false;
            }
        }

        if let Some(max_amount) = query.max_amount {
            if utxo.output.value > max_amount {
                return false;
            }
        }

        if let Some(min_confirmations) = query.min_confirmations {
            if utxo.confirmations < min_confirmations {
                return false;
            }
        }

        // Add more filters as needed
        true
    }
}

// Add bincode dependency to Cargo.toml
// bincode = "1.3"