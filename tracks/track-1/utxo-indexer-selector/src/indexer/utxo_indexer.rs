use anyhow::{anyhow, Result};
use bitcoin::{OutPoint, Address, Network};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};
use tracing::{debug, info, warn, error};

use crate::config::Config;
use crate::rpc::BitcoinRpcClient;
use crate::storage::RocksDbStorage;
use crate::types::{UtxoEntry, IndexStats, BlockProcessingResult, classify_script_type};

pub struct UtxoIndexer {
    rpc_client: BitcoinRpcClient,
    storage: std::sync::Arc<RocksDbStorage>,
    config: Config,
}

impl UtxoIndexer {
    pub async fn new(config: Config) -> Result<Self> {
        info!("Initializing UTXO Indexer");

        // Initialize RPC client
        let rpc_client = BitcoinRpcClient::new(&config.bitcoin)?;
        
        // Test connection
        rpc_client.test_connection().await?;
        
        // Verify we're on the expected network
        if config.bitcoin.network == "regtest" {
            if !rpc_client.is_regtest().await? {
                return Err(anyhow!("Expected regtest network, but node is not in regtest mode"));
            }
            info!("Confirmed connection to regtest network");
        }

        // Initialize storage
        let storage = std::sync::Arc::new(RocksDbStorage::new(&config.storage)?);
        
        info!("UTXO Indexer initialized successfully");
        
        Ok(Self {
            rpc_client,
            storage,
            config,
        })
    }

    pub async fn new_with_storage(config: Config, storage: std::sync::Arc<RocksDbStorage>) -> Result<Self> {
        info!("Initializing UTXO Indexer with shared storage");

        // Initialize RPC client
        let rpc_client = BitcoinRpcClient::new(&config.bitcoin)?;
        
        // Test connection
        rpc_client.test_connection().await?;
        
        // Verify we're on the expected network
        if config.bitcoin.network == "regtest" {
            if !rpc_client.is_regtest().await? {
                return Err(anyhow!("Expected regtest network, but node is not in regtest mode"));
            }
            info!("Confirmed connection to regtest network");
        }
        
        info!("UTXO Indexer initialized successfully with shared storage");
        
        Ok(Self {
            rpc_client,
            storage,
            config,
        })
    }

    pub async fn start(&self) -> Result<()> {
        info!("Starting UTXO indexer");

        // Get current state
        let current_stats = self.storage.get_stats()?.unwrap_or_else(|| {
            info!("No existing index found, starting from genesis");
            IndexStats {
                total_utxos: 0,
                total_value: 0u64,
                current_height: 0,
                blocks_processed: 0,
                progress_percent: 0.0,
                last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
            }
        });

        info!("Current index state: {} UTXOs at height {}", 
              current_stats.total_utxos, current_stats.current_height);

        // Get blockchain height
        let blockchain_height = self.rpc_client.get_block_count().await?;
        info!("Blockchain height: {}", blockchain_height);

        // Determine starting height
        let start_height = if current_stats.current_height == 0 {
            self.config.indexer.start_height
        } else {
            current_stats.current_height + 1
        };

        info!("Starting indexing from height {}", start_height);

        // Initial sync
        if start_height <= blockchain_height {
            self.sync_blocks(start_height, blockchain_height).await?;
        }

        // Start monitoring for new blocks
        self.monitor_new_blocks(blockchain_height).await?;

        Ok(())
    }

    async fn sync_blocks(&self, start_height: u64, end_height: u64) -> Result<()> {
        info!("Syncing blocks from {} to {}", start_height, end_height);
        
        let mut current_height = start_height;
        let batch_size = self.config.indexer.batch_size as u64;

        while current_height <= end_height {
            let batch_end = std::cmp::min(current_height + batch_size - 1, end_height);
            
            info!("Processing batch: {} to {} ({:.1}%)", 
                  current_height, batch_end,
                  (current_height as f64 / end_height as f64) * 100.0);

            for height in current_height..=batch_end {
                let result = self.process_block(height).await?;
                
                debug!("Processed block {}: +{} UTXOs, -{} UTXOs, {}ms",
                       result.height, result.utxos_created, result.utxos_spent, 
                       result.processing_time_ms);

                // Update progress periodically
                if height % 10 == 0 {
                    self.update_stats(height).await?;
                }
            }

            current_height = batch_end + 1;
            
            // Small delay to prevent overwhelming the RPC
            tokio::time::sleep(Duration::from_millis(10)).await;
        }

        // Final stats update
        self.update_stats(end_height).await?;
        info!("Block sync completed up to height {}", end_height);
        
        Ok(())
    }

    async fn monitor_new_blocks(&self, mut last_height: u64) -> Result<()> {
        info!("Starting new block monitoring from height {}", last_height);

        loop {
            let current_height = self.rpc_client.get_block_count().await?;
            
            if current_height > last_height {
                info!("New block(s) detected: {} -> {}", last_height, current_height);
                
                // Process new blocks
                for height in (last_height + 1)..=current_height {
                    let result = self.process_block(height).await?;
                    
                    info!("Processed new block {}: +{} UTXOs, -{} UTXOs, {}ms",
                          result.height, result.utxos_created, result.utxos_spent, 
                          result.processing_time_ms);
                }
                
                self.update_stats(current_height).await?;
                last_height = current_height;
            }
            
            // Wait before checking again
            tokio::time::sleep(Duration::from_secs(self.config.indexer.poll_interval_secs)).await;
        }
    }

    async fn process_block(&self, height: u64) -> Result<BlockProcessingResult> {
        let start_time = Instant::now();
        
        // Get the block
        let block = self.rpc_client.get_block_by_height(height).await?;
        let block_hash = block.block_hash().to_string();
        
        let mut utxos_created = 0;
        let mut utxos_spent = 0;

        // Process each transaction in the block
        for (tx_index, tx) in block.txdata.iter().enumerate() {
            let txid = tx.txid();
            
            // Process inputs (spend UTXOs) - skip coinbase
            if tx_index > 0 {
                for input in &tx.input {
                    let outpoint = input.previous_output;
                    if let Some(_spent_utxo) = self.storage.remove_utxo(&outpoint)? {
                        utxos_spent += 1;
                        debug!("Spent UTXO: {:?}", outpoint);
                    }
                }
            }

            // Process outputs (create UTXOs)
            for (vout, output) in tx.output.iter().enumerate() {
                let outpoint = OutPoint {
                    txid,
                    vout: vout as u32,
                };

                // Derive address from script_pubkey (Maestro-style)
                let network = match self.config.bitcoin.network.as_str() {
                    "mainnet" => Network::Bitcoin,
                    "testnet" => Network::Testnet,
                    "regtest" => Network::Regtest,
                    _ => Network::Regtest, // Default fallback
                };
                
                let address = Address::from_script(&output.script_pubkey, network)
                    .ok()
                    .map(|addr| addr.to_string());
                
                let script_type = classify_script_type(&output.script_pubkey);

                let utxo_entry = UtxoEntry {
                    outpoint,
                    output: output.clone(),
                    block_height: height,
                    block_hash: block_hash.clone(),
                    is_coinbase: tx_index == 0,
                    confirmations: 1, // Will be updated in update_stats
                    address,
                    script_type,
                };

                self.storage.store_utxo(&utxo_entry)?;
                utxos_created += 1;
                
                debug!("Created UTXO: {:?} = {} sats", 
                       outpoint, output.value);
            }
        }

        let processing_time_ms = start_time.elapsed().as_millis() as u64;

        Ok(BlockProcessingResult {
            height,
            hash: block_hash,
            utxos_created,
            utxos_spent,
            processing_time_ms,
        })
    }

    async fn update_stats(&self, current_height: u64) -> Result<()> {
        let blockchain_height = self.rpc_client.get_block_count().await?;
        
        // Get all UTXOs to calculate stats (this could be optimized with counters)
        let all_utxos = self.storage.get_all_utxos()?;
        
        let total_utxos = all_utxos.len() as u64;
        let total_value: u64 = all_utxos.iter()
            .map(|utxo| utxo.output.value)
            .sum();

        let progress_percent = if blockchain_height > 0 {
            (current_height as f64 / blockchain_height as f64) * 100.0
        } else {
            0.0
        };

        // Update confirmations for all UTXOs
        for mut utxo in all_utxos {
            utxo.confirmations = current_height - utxo.block_height + 1;
            self.storage.store_utxo(&utxo)?;
        }

        let stats = IndexStats {
            total_utxos,
            total_value,
            current_height,
            blocks_processed: current_height + 1,
            progress_percent,
            last_update: SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs(),
        };

        self.storage.update_stats(&stats)?;
        
        info!("Index stats updated: {} UTXOs, {} BTC total, {:.1}% synced", 
              total_utxos, 
              (total_value as f64 / 100_000_000.0),
              progress_percent);

        Ok(())
    }

    pub async fn get_stats(&self) -> Result<IndexStats> {
        self.storage.get_stats()?
            .ok_or_else(|| anyhow!("No index statistics available"))
    }

    pub async fn rescan_from_height(&self, height: u64) -> Result<()> {
        warn!("Starting rescan from height {}", height);
        
        // Clear existing data from this height onwards
        // This is a simplified implementation - in production you'd want more sophisticated cleanup
        
        let blockchain_height = self.rpc_client.get_block_count().await?;
        self.sync_blocks(height, blockchain_height).await?;
        
        info!("Rescan completed");
        Ok(())
    }
}