use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
};
use bitcoin::OutPoint;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{error, info};

use crate::types::{
    IndexStats, UtxoEntry, UtxoQuery, UtxoSelectionCriteria, 
    SelectionStrategy, UtxoSelection
};
use super::server::AppState;

// Response types
#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

#[derive(Serialize)]
pub struct HealthResponse {
    pub status: String,
    pub timestamp: u64,
    pub version: String,
}

#[derive(Deserialize)]
pub struct SelectionRequest {
    pub target_amount: u64, // in satoshis
    pub strategy: Option<String>,
    pub max_utxos: Option<usize>,
    pub min_confirmations: Option<u64>,
    pub max_confirmations: Option<u64>,
    pub exclude_coinbase: Option<bool>,
    pub script_types: Option<Vec<String>>,
    /// Filter by specific addresses (Maestro-style)
    pub addresses: Option<Vec<String>>,
    /// Filter by address patterns
    pub address_patterns: Option<Vec<String>>,
    /// Fee rate in satoshis per vbyte for effective value calculation
    pub fee_rate_sat_per_vbyte: Option<f64>,
    /// Number of outputs in the transaction (for fee calculation)
    pub output_count: Option<usize>,
}

/// Wallet-centric selection request (simpler for single address)
#[derive(Deserialize)]
pub struct WalletSelectionRequest {
    pub target_amount: u64, // in satoshis
    pub strategy: Option<String>,
    pub max_utxos: Option<usize>,
    /// Fee rate in satoshis per vbyte for effective value calculation
    pub fee_rate_sat_per_vbyte: Option<f64>,
    /// Number of outputs in the transaction (for fee calculation)
    pub output_count: Option<usize>,
}

#[derive(Deserialize)]
pub struct BatchSelectionRequest {
    pub targets: Vec<SelectionRequest>,
    pub strategy: Option<String>,
}

#[derive(Deserialize)]
pub struct AmountRangeQuery {
    pub min_amount: Option<u64>,
    pub max_amount: Option<u64>,
    pub limit: Option<usize>,
}

#[derive(Serialize)]
pub struct UtxoDistribution {
    pub ranges: Vec<UtxoRange>,
    pub total_utxos: u64,
    pub total_value: u64,
}

#[derive(Serialize)]
pub struct UtxoRange {
    pub min_amount: u64,
    pub max_amount: u64,
    pub count: u64,
    pub total_value: u64,
    pub percentage: f64,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

/// Health check endpoint
pub async fn health_check() -> Json<ApiResponse<HealthResponse>> {
    let response = HealthResponse {
        status: "healthy".to_string(),
        timestamp: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    };

    Json(ApiResponse::success(response))
}

/// Get index statistics
pub async fn get_stats(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<IndexStats>>, StatusCode> {
    match state.storage.get_stats() {
        Ok(Some(stats)) => Ok(Json(ApiResponse::success(stats))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to get stats: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Get all UTXOs (with pagination)
pub async fn get_utxos(
    Query(params): Query<HashMap<String, String>>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<UtxoEntry>>>, StatusCode> {
    let limit = params.get("limit")
        .and_then(|s| s.parse().ok())
        .unwrap_or(100);
    
    let offset = params.get("offset")
        .and_then(|s| s.parse().ok())
        .unwrap_or(0);

    let query = UtxoQuery {
        min_amount: params.get("min_amount")
            .and_then(|s| s.parse::<u64>().ok()),
        max_amount: params.get("max_amount")
            .and_then(|s| s.parse::<u64>().ok()),
        min_confirmations: params.get("min_confirmations")
            .and_then(|s| s.parse().ok()),
        script_type: params.get("script_type").cloned(),
        limit: Some(limit),
        offset: Some(offset),
    };

    match state.storage.query_utxos(&query) {
        Ok(utxos) => Ok(Json(ApiResponse::success(utxos))),
        Err(e) => {
            error!("Failed to query UTXOs: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Get UTXO by outpoint
pub async fn get_utxo_by_outpoint(
    Path(outpoint_str): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<UtxoEntry>>, StatusCode> {
    // Parse outpoint from string format "txid:vout"
    let parts: Vec<&str> = outpoint_str.split(':').collect();
    if parts.len() != 2 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let txid = match parts[0].parse() {
        Ok(txid) => txid,
        Err(_) => return Err(StatusCode::BAD_REQUEST),
    };

    let vout: u32 = match parts[1].parse() {
        Ok(vout) => vout,
        Err(_) => return Err(StatusCode::BAD_REQUEST),
    };

    let outpoint = OutPoint { txid, vout };

    match state.storage.get_utxo(&outpoint) {
        Ok(Some(utxo)) => Ok(Json(ApiResponse::success(utxo))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(e) => {
            error!("Failed to get UTXO: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Query UTXOs with complex filters
pub async fn query_utxos(
    State(state): State<AppState>,
    Json(query): Json<UtxoQuery>,
) -> Result<Json<ApiResponse<Vec<UtxoEntry>>>, StatusCode> {
    match state.storage.query_utxos(&query) {
        Ok(utxos) => Ok(Json(ApiResponse::success(utxos))),
        Err(e) => {
            error!("Failed to query UTXOs: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Select UTXOs for a specific wallet address (wallet-centric approach)
pub async fn select_wallet_utxos(
    State(state): State<AppState>,
    Path(address): Path<String>,
    Json(request): Json<WalletSelectionRequest>,
) -> Result<Json<ApiResponse<UtxoSelection>>, StatusCode> {
    let criteria = UtxoSelectionCriteria {
        target_amount: request.target_amount,
        max_utxos: request.max_utxos,
        min_confirmations: None,
        max_confirmations: None,
        script_types: None,
        exclude_coinbase: None,
        addresses: Some(vec![address.clone()]), // Focus on this specific address
        address_patterns: None,
        fee_rate_sat_per_vbyte: request.fee_rate_sat_per_vbyte,
        output_count: request.output_count,
    };

    let strategy = match request.strategy.as_deref() {
        Some("largest_first") => SelectionStrategy::LargestFirst,
        Some("smallest_first") => SelectionStrategy::SmallestFirst,
        Some("oldest_first") => SelectionStrategy::OldestFirst,
        Some("newest_first") => SelectionStrategy::NewestFirst,
        Some("branch_and_bound") => SelectionStrategy::BranchAndBound,
        Some("effective_value") => SelectionStrategy::EffectiveValue,
        _ => SelectionStrategy::LargestFirst, // Default
    };

    match state.selector.select_utxos(&criteria, strategy) {
        Ok(selection) => {
            info!("Selected {} UTXOs for {} sats from wallet {} using {}", 
                  selection.utxos.len(), request.target_amount, address, strategy.as_str());
            Ok(Json(ApiResponse::success(selection)))
        },
        Err(e) => {
            error!("Failed to select UTXOs for wallet {}: {}", address, e);
            Ok(Json(ApiResponse::error(e.to_string())))
        }
    }
}

/// Select UTXOs for a target amount (global approach)
pub async fn select_utxos(
    State(state): State<AppState>,
    Json(request): Json<SelectionRequest>,
) -> Result<Json<ApiResponse<UtxoSelection>>, StatusCode> {
    let criteria = UtxoSelectionCriteria {
        target_amount: request.target_amount,
        max_utxos: request.max_utxos,
        min_confirmations: request.min_confirmations,
        max_confirmations: request.max_confirmations,
        script_types: request.script_types,
        exclude_coinbase: request.exclude_coinbase,
        addresses: request.addresses,
        address_patterns: request.address_patterns,
        fee_rate_sat_per_vbyte: request.fee_rate_sat_per_vbyte,
        output_count: request.output_count,
    };

    let strategy = match request.strategy.as_deref() {
        Some("largest_first") => SelectionStrategy::LargestFirst,
        Some("smallest_first") => SelectionStrategy::SmallestFirst,
        Some("oldest_first") => SelectionStrategy::OldestFirst,
        Some("newest_first") => SelectionStrategy::NewestFirst,
        Some("branch_and_bound") => SelectionStrategy::BranchAndBound,
        Some("effective_value") => SelectionStrategy::EffectiveValue,
        _ => SelectionStrategy::LargestFirst, // Default
    };

    match state.selector.select_utxos(&criteria, strategy) {
        Ok(selection) => {
            info!("Selected {} UTXOs for {} sats using {}", 
                  selection.utxos.len(), request.target_amount, strategy.as_str());
            Ok(Json(ApiResponse::success(selection)))
        },
        Err(e) => {
            error!("Failed to select UTXOs: {}", e);
            Ok(Json(ApiResponse::error(e.to_string())))
        }
    }
}

/// Select optimal UTXOs (tries multiple strategies)
pub async fn select_optimal_utxos(
    State(state): State<AppState>,
    Json(request): Json<SelectionRequest>,
) -> Result<Json<ApiResponse<UtxoSelection>>, StatusCode> {
    let criteria = UtxoSelectionCriteria {
        target_amount: request.target_amount,
        max_utxos: request.max_utxos,
        min_confirmations: request.min_confirmations,
        max_confirmations: request.max_confirmations,
        script_types: request.script_types,
        exclude_coinbase: request.exclude_coinbase,
        addresses: request.addresses,
        address_patterns: request.address_patterns,
        fee_rate_sat_per_vbyte: request.fee_rate_sat_per_vbyte,
        output_count: request.output_count,
    };

    match state.selector.select_optimal_utxos(&criteria) {
        Ok(selection) => {
            info!("Optimally selected {} UTXOs for {} sats using {}", 
                  selection.utxos.len(), request.target_amount, selection.strategy);
            Ok(Json(ApiResponse::success(selection)))
        },
        Err(e) => {
            error!("Failed to select optimal UTXOs: {}", e);
            Ok(Json(ApiResponse::error(e.to_string())))
        }
    }
}

/// Batch UTXO selection
pub async fn select_utxos_batch(
    State(state): State<AppState>,
    Json(request): Json<BatchSelectionRequest>,
) -> Result<Json<ApiResponse<Vec<UtxoSelection>>>, StatusCode> {
    let criteria_list: Vec<UtxoSelectionCriteria> = request.targets.into_iter()
        .map(|req| UtxoSelectionCriteria {
            target_amount: req.target_amount,
            max_utxos: req.max_utxos,
            min_confirmations: req.min_confirmations,
            max_confirmations: req.max_confirmations,
            script_types: req.script_types,
            exclude_coinbase: req.exclude_coinbase,
            addresses: req.addresses,
            address_patterns: req.address_patterns,
            fee_rate_sat_per_vbyte: req.fee_rate_sat_per_vbyte,
            output_count: req.output_count,
        })
        .collect();

    let strategy = match request.strategy.as_deref() {
        Some("largest_first") => SelectionStrategy::LargestFirst,
        Some("smallest_first") => SelectionStrategy::SmallestFirst,
        Some("oldest_first") => SelectionStrategy::OldestFirst,
        Some("newest_first") => SelectionStrategy::NewestFirst,
        Some("branch_and_bound") => SelectionStrategy::BranchAndBound,
        _ => SelectionStrategy::LargestFirst,
    };

    match state.selector.select_utxos_batch(&criteria_list, strategy) {
        Ok(selections) => {
            info!("Batch selected UTXOs for {} targets", selections.len());
            Ok(Json(ApiResponse::success(selections)))
        },
        Err(e) => {
            error!("Failed to batch select UTXOs: {}", e);
            Ok(Json(ApiResponse::error(e.to_string())))
        }
    }
}

/// Get UTXO distribution analysis
pub async fn get_utxo_distribution(
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<UtxoDistribution>>, StatusCode> {
    match state.storage.get_all_utxos() {
        Ok(utxos) => {
            let distribution = analyze_utxo_distribution(&utxos);
            Ok(Json(ApiResponse::success(distribution)))
        },
        Err(e) => {
            error!("Failed to get UTXO distribution: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Get UTXOs by amount range
pub async fn get_utxos_by_amount_range(
    Query(query): Query<AmountRangeQuery>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<Vec<UtxoEntry>>>, StatusCode> {
    let utxo_query = UtxoQuery {
        min_amount: query.min_amount,
        max_amount: query.max_amount,
        min_confirmations: None,
        script_type: None,
        limit: query.limit,
        offset: None,
    };

    match state.storage.query_utxos(&utxo_query) {
        Ok(utxos) => Ok(Json(ApiResponse::success(utxos))),
        Err(e) => {
            error!("Failed to get UTXOs by amount range: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Trigger a rescan (admin endpoint)
pub async fn trigger_rescan(
    Query(params): Query<HashMap<String, String>>,
    State(_state): State<AppState>,
) -> Result<Json<ApiResponse<String>>, StatusCode> {
    let _height = params.get("height")
        .and_then(|s| s.parse::<u64>().ok())
        .unwrap_or(0);

    // Note: This would require access to the indexer instance
    // For now, return a placeholder response
    Ok(Json(ApiResponse::success("Rescan triggered (not implemented in this handler)".to_string())))
}

// Helper functions

fn analyze_utxo_distribution(utxos: &[UtxoEntry]) -> UtxoDistribution {
    let ranges = vec![
        (0, 1000),           // 0-1000 sats
        (1000, 10000),       // 0.01-0.1 mBTC
        (10000, 100000),     // 0.1-1 mBTC
        (100000, 1000000),   // 1-10 mBTC
        (1000000, 10000000), // 10-100 mBTC
        (10000000, u64::MAX), // 100+ mBTC
    ];

    let total_utxos = utxos.len() as u64;
    let total_value: u64 = utxos.iter().map(|u| u.output.value).sum();

    let mut distribution_ranges = Vec::new();

    for (min, max) in ranges {
        let utxos_in_range: Vec<&UtxoEntry> = utxos.iter()
            .filter(|u| {
                let value = u.output.value;
                value >= min && (max == u64::MAX || value < max)
            })
            .collect();

        let count = utxos_in_range.len() as u64;
        let range_value: u64 = utxos_in_range.iter()
            .map(|u| u.output.value)
            .sum();
        let percentage = if total_utxos > 0 {
            (count as f64 / total_utxos as f64) * 100.0
        } else {
            0.0
        };

        distribution_ranges.push(UtxoRange {
            min_amount: min,
            max_amount: if max == u64::MAX { max } else { max - 1 },
            count,
            total_value: range_value,
            percentage,
        });
    }

    UtxoDistribution {
        ranges: distribution_ranges,
        total_utxos,
        total_value,
    }
}