use bitcoin::{OutPoint, Txid};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Rune identifier (block height + transaction index)
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct RuneId {
    pub block: u32,
    pub tx: u32,
}

impl RuneId {
    pub fn new(block: u32, tx: u32) -> Self {
        Self { block, tx }
    }
}

/// Rune information stored in the database
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuneInfo {
    pub id: RuneId,
    pub name: String,
    pub symbol: Option<String>,
    pub divisibility: u8,
    pub spacers: u32,
    pub terms: Option<RuneTerms>,
    pub turbo: bool,
    pub etching_block: u32,
    pub etching_tx: u32,
}

/// Minting terms for a rune
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuneTerms {
    pub amount: Option<u128>,
    pub cap: Option<u128>,
    pub height: Option<(u32, u32)>, // (start, end)
    pub offset: Option<(u32, u32)>, // (start, end)
}

/// Rune balances attached to a UTXO
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuneUtxoData {
    pub balances: HashMap<RuneId, u128>,
}

impl RuneUtxoData {
    pub fn new() -> Self {
        Self {
            balances: HashMap::new(),
        }
    }

    pub fn is_empty(&self) -> bool {
        self.balances.is_empty()
    }

    pub fn total_runes(&self) -> usize {
        self.balances.len()
    }

    pub fn get_balance(&self, rune_id: &RuneId) -> u128 {
        self.balances.get(rune_id).copied().unwrap_or(0)
    }

    pub fn set_balance(&mut self, rune_id: RuneId, amount: u128) {
        if amount > 0 {
            self.balances.insert(rune_id, amount);
        } else {
            self.balances.remove(&rune_id);
        }
    }

    pub fn add_balance(&mut self, rune_id: RuneId, amount: u128) {
        let current = self.get_balance(&rune_id);
        self.set_balance(rune_id, current.saturating_add(amount));
    }
}

/// Activity record for a rune in a specific transaction
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuneActivity {
    pub rune_id: RuneId,
    pub tx_id: Txid,
    pub address: String,
    pub sent: u128,
    pub received: u128,
    pub block_height: u32,
}

/// Changes to apply to the runes database
#[derive(Debug, Default)]
pub struct RuneChanges {
    pub new_runes: Vec<RuneInfo>,
    pub mint_updates: HashMap<RuneId, u128>, // rune_id -> new_mint_count
    pub utxo_runes: HashMap<OutPoint, RuneUtxoData>,
    pub activities: Vec<RuneActivity>,
}

impl RuneChanges {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn is_empty(&self) -> bool {
        self.new_runes.is_empty() 
            && self.mint_updates.is_empty() 
            && self.utxo_runes.is_empty() 
            && self.activities.is_empty()
    }
}

/// Runestone artifact from transaction parsing
#[derive(Clone, Debug)]
pub enum RunestoneArtifact {
    Runestone {
        edicts: Vec<Edict>,
        etching: Option<Etching>,
        mint: Option<RuneId>,
        pointer: Option<u32>,
    },
    Cenotaph {
        flaws: Vec<Flaw>,
    },
}

/// Edict for transferring runes
#[derive(Clone, Debug)]
pub struct Edict {
    pub id: RuneId,
    pub amount: u128,
    pub output: u32,
}

/// Etching data for creating new runes
#[derive(Clone, Debug)]
pub struct Etching {
    pub name: String,
    pub symbol: Option<String>,
    pub divisibility: Option<u8>,
    pub spacers: Option<u32>,
    pub terms: Option<RuneTerms>,
    pub turbo: bool,
}

/// Flaws in cenotaph runestones
#[derive(Clone, Debug)]
pub enum Flaw {
    EdictOutput,
    EdictRuneId,
    InvalidScript,
    Opcode,
    SupplyOverflow,
    TrailingIntegers,
    TruncatedField,
    UnrecognizedEvenTag,
    UnrecognizedFlag,
    Varint,
}

/// Enhanced UTXO entry with runes data
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RuneAwareUtxoEntry {
    pub outpoint: OutPoint,
    pub output: bitcoin::TxOut,
    pub height: u32,
    pub confirmations: u32,
    pub is_coinbase: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runes: Option<RuneUtxoData>,
}

impl From<crate::types::UtxoEntry> for RuneAwareUtxoEntry {
    fn from(utxo: crate::types::UtxoEntry) -> Self {
        Self {
            outpoint: utxo.outpoint,
            output: utxo.output,
            height: utxo.height,
            confirmations: utxo.confirmations,
            is_coinbase: utxo.is_coinbase,
            runes: None, // Will be populated by runes processor
        }
    }
}

/// Request for rune-aware UTXO selection
#[derive(Debug, Deserialize)]
pub struct RuneAwareSelectionRequest {
    pub target_amount: u64,
    pub strategy: String,
    pub max_utxos: Option<usize>,
    
    // Runes-specific criteria
    pub include_runes: Option<bool>,
    pub required_runes: Option<Vec<RuneId>>,
    pub exclude_runes: Option<Vec<RuneId>>,
    pub min_rune_amount: Option<HashMap<RuneId, u128>>,
}

/// Response for rune-aware UTXO selection
#[derive(Debug, Serialize)]
pub struct RuneAwareSelectionResponse {
    pub utxos: Vec<RuneAwareUtxoEntry>,
    pub total_amount: u64,
    pub change_amount: u64,
    pub strategy: String,
    pub rune_summary: HashMap<RuneId, u128>, // Total runes in selection
}