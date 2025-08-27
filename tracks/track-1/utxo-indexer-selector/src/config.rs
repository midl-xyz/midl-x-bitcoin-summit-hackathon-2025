use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct Config {
    pub bitcoin: BitcoinConfig,
    pub storage: StorageConfig,
    pub api: ApiConfig,
    pub indexer: IndexerConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BitcoinConfig {
    /// Bitcoin RPC URL (e.g., "http://127.0.0.1:8332")
    pub rpc_url: String,
    /// RPC username
    pub rpc_user: String,
    /// RPC password
    pub rpc_password: String,
    /// Network (regtest, testnet, mainnet)
    pub network: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct StorageConfig {
    /// Database path for RocksDB
    pub db_path: String,
    /// Enable compression
    pub enable_compression: bool,
    /// Cache size in MB
    pub cache_size_mb: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ApiConfig {
    /// API server bind address
    pub bind_address: String,
    /// API server port
    pub port: u16,
    /// Enable CORS
    pub enable_cors: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct IndexerConfig {
    /// Starting block height for indexing (0 = genesis)
    pub start_height: u64,
    /// Batch size for processing blocks
    pub batch_size: u32,
    /// Polling interval in seconds for new blocks
    pub poll_interval_secs: u64,
    /// Enable UTXO set validation
    pub enable_validation: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            bitcoin: BitcoinConfig {
                rpc_url: "http://127.0.0.1:8332".to_string(),
                rpc_user: "1".to_string(),
                rpc_password: "1".to_string(),
                network: "regtest".to_string(),
            },
            storage: StorageConfig {
                db_path: "./utxo_index.db".to_string(),
                enable_compression: true,
                cache_size_mb: 256,
            },
            api: ApiConfig {
                bind_address: "127.0.0.1".to_string(),
                port: 3030,
                enable_cors: true,
            },
            indexer: IndexerConfig {
                start_height: 0,
                batch_size: 10,
                poll_interval_secs: 5,
                enable_validation: true,
            },
        }
    }
}

impl Config {
    pub fn load<P: AsRef<Path>>(path: P) -> Result<Self> {
        if !path.as_ref().exists() {
            tracing::warn!("Config file not found, creating default config at {:?}", path.as_ref());
            let default_config = Self::default();
            default_config.save(&path)?;
            return Ok(default_config);
        }

        let content = std::fs::read_to_string(path)?;
        let config: Config = toml::from_str(&content)?;
        Ok(config)
    }

    pub fn save<P: AsRef<Path>>(&self, path: P) -> Result<()> {
        let content = toml::to_string_pretty(self)?;
        std::fs::write(path, content)?;
        Ok(())
    }
}