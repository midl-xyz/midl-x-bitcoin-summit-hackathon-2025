use anyhow::Result;
use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing::info;

use crate::config::Config;
use crate::storage::RocksDbStorage;
use crate::selector::UtxoSelector;
use super::handlers::*;

pub struct ApiServer {
    config: Config,
    storage: Arc<RocksDbStorage>,
    selector: Arc<UtxoSelector>,
}

impl ApiServer {
    pub async fn new(config: Config) -> Result<Self> {
        info!("Initializing API server");

        // Initialize storage
        let storage = Arc::new(RocksDbStorage::new(&config.storage)?);
        
        // Initialize selector with the same storage
        let selector = Arc::new(UtxoSelector::new_with_storage(
            storage.clone()
        ));

        Ok(Self {
            config,
            storage,
            selector,
        })
    }

    pub async fn new_with_storage(config: Config, storage: std::sync::Arc<RocksDbStorage>) -> Result<Self> {
        info!("Initializing API server with shared storage");
        
        // Initialize selector with shared storage
        let selector = Arc::new(UtxoSelector::new_with_storage(
            storage.clone()
        ));

        Ok(Self {
            config,
            storage,
            selector,
        })
    }

    pub async fn start(&self) -> Result<()> {
        let bind_addr = format!("{}:{}", self.config.api.bind_address, self.config.api.port);
        info!("Starting API server on {}", bind_addr);

        // Create shared state
        let app_state = AppState {
            storage: self.storage.clone(),
            selector: self.selector.clone(),
        };

        // Build the router
        let app = Router::new()
            // Health check
            .route("/health", get(health_check))
            
            // Index statistics
            .route("/stats", get(get_stats))
            
            // UTXO queries
            .route("/utxos", get(get_utxos))
            .route("/utxos/:outpoint", get(get_utxo_by_outpoint))
            .route("/utxos/query", post(query_utxos))
            
            // UTXO selection
            .route("/select", post(select_utxos))
            .route("/select/optimal", post(select_optimal_utxos))
            .route("/select/batch", post(select_utxos_batch))
            
            // Wallet-centric selection (your preferred approach)
            .route("/wallet/:address/select", post(select_wallet_utxos))
            
            // Analysis endpoints
            .route("/analysis/distribution", get(get_utxo_distribution))
            .route("/analysis/by-amount", get(get_utxos_by_amount_range))
            
            // Admin endpoints
            .route("/admin/rescan", post(trigger_rescan))
            
            .with_state(app_state);

        // Add CORS if enabled
        let app = if self.config.api.enable_cors {
            app.layer(CorsLayer::permissive())
        } else {
            app
        };

        // Start the server
        let listener = tokio::net::TcpListener::bind(&bind_addr).await?;
        info!("API server listening on {}", bind_addr);
        
        axum::serve(listener, app).await?;

        Ok(())
    }
}

#[derive(Clone)]
pub struct AppState {
    pub storage: Arc<RocksDbStorage>,
    pub selector: Arc<UtxoSelector>,
}