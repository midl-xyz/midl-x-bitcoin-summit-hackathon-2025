use bitcoin::{OutPoint, TxOut, Address, Network};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a UTXO entry in our index
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtxoEntry {
    /// The outpoint (transaction hash + output index)
    pub outpoint: OutPoint,
    /// The transaction output
    pub output: TxOut,
    /// Block height where this UTXO was created
    pub block_height: u64,
    /// Block hash where this UTXO was created
    pub block_hash: String,
    /// Whether this UTXO is coinbase
    pub is_coinbase: bool,
    /// Confirmation count (current height - block_height + 1)
    pub confirmations: u64,
    /// The Bitcoin address this UTXO belongs to (Maestro-style)
    pub address: Option<String>,
    /// Script type classification
    pub script_type: String,
}

/// UTXO selection criteria
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtxoSelectionCriteria {
    /// Target amount to select
    pub target_amount: u64,
    /// Maximum number of UTXOs to select
    pub max_utxos: Option<usize>,
    /// Minimum confirmation count required
    pub min_confirmations: Option<u64>,
    /// Maximum confirmation count (for spending fresh UTXOs first)
    pub max_confirmations: Option<u64>,
    /// Specific script types to include
    pub script_types: Option<Vec<String>>,
    /// Exclude coinbase UTXOs
    pub exclude_coinbase: Option<bool>,
    /// Filter by specific addresses (Maestro-style)
    pub addresses: Option<Vec<String>>,
    /// Filter by address patterns (regex support)
    pub address_patterns: Option<Vec<String>>,
    /// Fee rate in satoshis per vbyte for effective value calculation
    pub fee_rate_sat_per_vbyte: Option<f64>,
    /// Number of outputs in the transaction (for fee calculation)
    pub output_count: Option<usize>,
}

/// UTXO selection result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtxoSelection {
    /// Selected UTXOs
    pub utxos: Vec<UtxoEntry>,
    /// Total amount of selected UTXOs
    pub total_amount: u64,
    /// Change amount (total - target)
    pub change_amount: u64,
    /// Selection strategy used
    pub strategy: String,
}

/// UTXO selection strategy
#[derive(Debug, Clone, Copy)]
pub enum SelectionStrategy {
    /// Select largest UTXOs first
    LargestFirst,
    /// Select smallest UTXOs first (minimize change)
    SmallestFirst,
    /// Select oldest UTXOs first
    OldestFirst,
    /// Select newest UTXOs first
    NewestFirst,
    /// Branch and bound algorithm (optimal selection)
    BranchAndBound,
    /// Effective value selection (considers transaction fees)
    EffectiveValue,
}

impl SelectionStrategy {
    pub fn as_str(&self) -> &'static str {
        match self {
            SelectionStrategy::LargestFirst => "largest_first",
            SelectionStrategy::SmallestFirst => "smallest_first",
            SelectionStrategy::OldestFirst => "oldest_first",
            SelectionStrategy::NewestFirst => "newest_first",
            SelectionStrategy::BranchAndBound => "branch_and_bound",
            SelectionStrategy::EffectiveValue => "effective_value",
        }
    }
}

/// Index statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexStats {
    /// Total number of UTXOs indexed
    pub total_utxos: u64,
    /// Total value of all UTXOs
    pub total_value: u64,
    /// Current block height
    pub current_height: u64,
    /// Number of blocks processed
    pub blocks_processed: u64,
    /// Indexing progress (percentage)
    pub progress_percent: f64,
    /// Last update timestamp
    pub last_update: u64,
}

/// Block processing result
#[derive(Debug, Clone)]
pub struct BlockProcessingResult {
    /// Block height
    pub height: u64,
    /// Block hash
    pub hash: String,
    /// Number of UTXOs created
    pub utxos_created: u32,
    /// Number of UTXOs spent
    pub utxos_spent: u32,
    /// Processing time in milliseconds
    pub processing_time_ms: u64,
}

/// UTXO query parameters
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UtxoQuery {
    /// Filter by minimum amount
    pub min_amount: Option<u64>,
    /// Filter by maximum amount
    pub max_amount: Option<u64>,
    /// Filter by minimum confirmations
    pub min_confirmations: Option<u64>,
    /// Filter by script type
    pub script_type: Option<String>,
    /// Limit number of results
    pub limit: Option<usize>,
    /// Offset for pagination
    pub offset: Option<usize>,
}

pub type UtxoSet = HashMap<OutPoint, UtxoEntry>;

/// Utility functions for address derivation (Maestro-style)
impl UtxoEntry {
    /// Derive Bitcoin address from script_pubkey
    pub fn derive_address(&mut self, network: Network) {
        self.address = Address::from_script(&self.output.script_pubkey, network)
            .ok()
            .map(|addr| addr.to_string());
        
        self.script_type = classify_script_type(&self.output.script_pubkey);
    }
    
    /// Check if this UTXO belongs to any of the specified addresses
    pub fn matches_addresses(&self, addresses: &[String]) -> bool {
        if let Some(ref utxo_address) = self.address {
            addresses.iter().any(|addr| addr == utxo_address)
        } else {
            false
        }
    }
}

/// Classify script type for Maestro-style filtering
pub fn classify_script_type(script: &bitcoin::Script) -> String {
    if script.is_p2pkh() {
        "p2pkh".to_string()
    } else if script.is_p2sh() {
        "p2sh".to_string()
    } else if script.is_v0_p2wpkh() {
        "p2wpkh".to_string()
    } else if script.is_v0_p2wsh() {
        "p2wsh".to_string()
    } else if script.is_v1_p2tr() {
        "p2tr".to_string()
    } else if script.is_op_return() {
        "op_return".to_string()
    } else {
        "unknown".to_string()
    }
}