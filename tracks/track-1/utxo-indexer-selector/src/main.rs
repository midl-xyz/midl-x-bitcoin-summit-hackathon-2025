use anyhow::Result;
use clap::Parser;
use tracing::{info, warn};
use tracing_subscriber;

mod indexer;
mod selector;
mod rpc;
mod storage;
mod api;
mod config;
mod fee_estimation;
mod types;

use config::Config;

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Cli {
    /// Configuration file path
    #[arg(short, long, default_value = "config.toml")]
    config: String,

    /// Run mode: indexer, api, or both
    #[arg(short, long, default_value = "both")]
    mode: String,

    /// Log level
    #[arg(long, default_value = "info")]
    log_level: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(&cli.log_level)
        .init();

    info!("Starting UTXO Indexer-Selector");

    // Load configuration
    let config = Config::load(&cli.config)?;
    info!("Loaded configuration from {}", cli.config);

    match cli.mode.as_str() {
        "indexer" => {
            info!("Starting in indexer-only mode");
            run_indexer(config).await?;
        }
        "api" => {
            info!("Starting in API-only mode");
            run_api(config).await?;
        }
        "both" => {
            info!("Starting in full mode (indexer + API)");
            run_both(config).await?;
        }
        _ => {
            warn!("Unknown mode: {}. Using 'both'", cli.mode);
            run_both(config).await?;
        }
    }

    Ok(())
}

async fn run_indexer(config: Config) -> Result<()> {
    let indexer = indexer::UtxoIndexer::new(config).await?;
    indexer.start().await
}

async fn run_api(config: Config) -> Result<()> {
    let api_server = api::ApiServer::new(config).await?;
    api_server.start().await
}

async fn run_both(config: Config) -> Result<()> {
    // Create shared storage instance
    let storage = std::sync::Arc::new(storage::RocksDbStorage::new(&config.storage)?);
    
    let indexer_config = config.clone();
    let api_config = config;
    let storage_for_indexer = storage.clone();
    let storage_for_api = storage.clone();

    // Start indexer in background
    let indexer_handle = tokio::spawn(async move {
        let indexer = indexer::UtxoIndexer::new_with_storage(indexer_config, storage_for_indexer).await?;
        indexer.start().await
    });

    // Start API server
    let api_handle = tokio::spawn(async move {
        let api_server = api::ApiServer::new_with_storage(api_config, storage_for_api).await?;
        api_server.start().await
    });

    // Wait for both to complete (or one to fail)
    tokio::select! {
        result = indexer_handle => {
            match result? {
                Ok(_) => info!("Indexer completed successfully"),
                Err(e) => return Err(e),
            }
        }
        result = api_handle => {
            match result? {
                Ok(_) => info!("API server completed successfully"),
                Err(e) => return Err(e),
            }
        }
    }

    Ok(())
}