use anyhow::{anyhow, Result};

use tracing::{debug, info};

use crate::storage::RocksDbStorage;
use crate::types::{UtxoEntry, UtxoSelection, UtxoSelectionCriteria, SelectionStrategy};
use super::algorithms::*;

pub struct UtxoSelector {
    storage: std::sync::Arc<RocksDbStorage>,
}

impl UtxoSelector {
    pub fn new(storage: RocksDbStorage) -> Self {
        Self { 
            storage: std::sync::Arc::new(storage) 
        }
    }

    pub fn new_with_storage(storage: std::sync::Arc<RocksDbStorage>) -> Self {
        Self { storage }
    }

    /// Select UTXOs based on criteria and strategy
    pub fn select_utxos(
        &self,
        criteria: &UtxoSelectionCriteria,
        strategy: SelectionStrategy,
    ) -> Result<UtxoSelection> {
        info!("Selecting UTXOs: target={} sats, strategy={}", 
              criteria.target_amount, strategy.as_str());

        // Get all available UTXOs
        let all_utxos = self.storage.get_all_utxos()?;
        
        // Filter UTXOs based on criteria
        let filtered_utxos = self.filter_utxos(&all_utxos, criteria)?;
        
        if filtered_utxos.is_empty() {
            return Err(anyhow!("No UTXOs match the selection criteria"));
        }

        debug!("Filtered to {} UTXOs from {} total", 
               filtered_utxos.len(), all_utxos.len());

        // Apply selection algorithm
        let selected_utxos = match strategy {
            SelectionStrategy::LargestFirst => {
                largest_first_selection(&filtered_utxos, criteria.target_amount)?
            }
            SelectionStrategy::SmallestFirst => {
                smallest_first_selection(&filtered_utxos, criteria.target_amount)?
            }
            SelectionStrategy::OldestFirst => {
                oldest_first_selection(&filtered_utxos, criteria.target_amount)?
            }
            SelectionStrategy::NewestFirst => {
                newest_first_selection(&filtered_utxos, criteria.target_amount)?
            }
            SelectionStrategy::BranchAndBound => {
                branch_and_bound_selection(&filtered_utxos, criteria.target_amount)?
            }
            SelectionStrategy::EffectiveValue => {
                let fee_rate = criteria.fee_rate_sat_per_vbyte.unwrap_or(1.0);
                effective_value_selection(&filtered_utxos, criteria.target_amount, fee_rate, criteria.output_count)?
            }
        };

        if selected_utxos.is_empty() {
            return Err(anyhow!("Could not select sufficient UTXOs for target amount"));
        }

        // Calculate totals
        let total_amount: u64 = selected_utxos.iter()
            .map(|utxo| utxo.output.value)
            .sum();

        if total_amount < criteria.target_amount {
            return Err(anyhow!(
                "Selected UTXOs ({} sats) insufficient for target ({} sats)",
                total_amount,
                criteria.target_amount
            ));
        }

        let change_amount = total_amount - criteria.target_amount;

        let selection = UtxoSelection {
            utxos: selected_utxos.clone(),
            total_amount,
            change_amount,
            strategy: strategy.as_str().to_string(),
        };

        info!("Selected {} UTXOs: {} sats total, {} sats change",
              selected_utxos.len(), total_amount, change_amount);

        Ok(selection)
    }

    /// Select UTXOs for multiple targets (batch selection)
    pub fn select_utxos_batch(
        &self,
        targets: &[UtxoSelectionCriteria],
        strategy: SelectionStrategy,
    ) -> Result<Vec<UtxoSelection>> {
        let mut results = Vec::new();
        let mut used_utxos = std::collections::HashSet::new();

        for criteria in targets {
            // Get available UTXOs (excluding already used ones)
            let all_utxos = self.storage.get_all_utxos()?;
            let available_utxos: Vec<UtxoEntry> = all_utxos
                .into_iter()
                .filter(|utxo| !used_utxos.contains(&utxo.outpoint))
                .collect();

            // Filter based on criteria
            let filtered_utxos = self.filter_utxos(&available_utxos, criteria)?;

            // Select UTXOs
            let selection = match strategy {
                SelectionStrategy::LargestFirst => {
                    let utxos = largest_first_selection(&filtered_utxos, criteria.target_amount)?;
                    self.create_selection(utxos, criteria.target_amount, strategy)
                }
                // Add other strategies as needed
                _ => return Err(anyhow!("Strategy not implemented for batch selection")),
            }?;

            // Mark UTXOs as used
            for utxo in &selection.utxos {
                used_utxos.insert(utxo.outpoint);
            }

            results.push(selection);
        }

        Ok(results)
    }

    /// Get optimal UTXO selection with multiple strategies and return the best one
    pub fn select_optimal_utxos(
        &self,
        criteria: &UtxoSelectionCriteria,
    ) -> Result<UtxoSelection> {
        let mut strategies = vec![
            SelectionStrategy::BranchAndBound,
            SelectionStrategy::SmallestFirst,
            SelectionStrategy::LargestFirst,
        ];
        
        // Add effective value strategy if fee rate is provided
        if criteria.fee_rate_sat_per_vbyte.is_some() {
            strategies.insert(0, SelectionStrategy::EffectiveValue); // Try effective value first
        }

        let mut best_selection: Option<UtxoSelection> = None;
        let mut best_score = f64::INFINITY;

        for strategy in strategies {
            match self.select_utxos(criteria, strategy) {
                Ok(selection) => {
                    let score = self.calculate_selection_score(&selection);
                    debug!("Strategy {} score: {}", strategy.as_str(), score);
                    
                    if score < best_score {
                        best_score = score;
                        best_selection = Some(selection);
                    }
                }
                Err(e) => {
                    debug!("Strategy {} failed: {}", strategy.as_str(), e);
                }
            }
        }

        best_selection.ok_or_else(|| anyhow!("No strategy could satisfy the selection criteria"))
    }

    // Helper methods

    fn filter_utxos(
        &self,
        utxos: &[UtxoEntry],
        criteria: &UtxoSelectionCriteria,
    ) -> Result<Vec<UtxoEntry>> {
        let mut filtered = Vec::new();

        for utxo in utxos {
            // Skip UTXOs with zero or negative value (unspendable)
            if utxo.output.value == 0 {
                continue;
            }

            // Check minimum confirmations
            if let Some(min_conf) = criteria.min_confirmations {
                if utxo.confirmations < min_conf {
                    continue;
                }
            }

            // Check maximum confirmations
            if let Some(max_conf) = criteria.max_confirmations {
                if utxo.confirmations > max_conf {
                    continue;
                }
            }

            // Check coinbase exclusion
            if criteria.exclude_coinbase.unwrap_or(false) && utxo.is_coinbase {
                continue;
            }

            // Check script types (if specified)
            if let Some(ref script_types) = criteria.script_types {
                if !script_types.contains(&utxo.script_type) {
                    continue;
                }
            }

            // Check address filtering (Maestro-style)
            if let Some(ref addresses) = criteria.addresses {
                if !utxo.matches_addresses(addresses) {
                    continue;
                }
            }

            // Check address patterns (regex support)
            if let Some(ref patterns) = criteria.address_patterns {
                if let Some(ref utxo_address) = utxo.address {
                    let matches_pattern = patterns.iter().any(|pattern| {
                        // Simple contains check for now - could be enhanced with regex
                        utxo_address.contains(pattern)
                    });
                    if !matches_pattern {
                        continue;
                    }
                } else {
                    continue; // Skip UTXOs without addresses
                }
            }

            filtered.push(utxo.clone());
        }

        Ok(filtered)
    }

    fn get_script_type(&self, output: &bitcoin::TxOut) -> String {
        if output.script_pubkey.is_p2pkh() {
            "p2pkh".to_string()
        } else if output.script_pubkey.is_p2sh() {
            "p2sh".to_string()
        } else if output.script_pubkey.is_v0_p2wpkh() {
            "p2wpkh".to_string()
        } else if output.script_pubkey.is_v0_p2wsh() {
            "p2wsh".to_string()
        } else if output.script_pubkey.is_v1_p2tr() {
            "p2tr".to_string()
        } else {
            "unknown".to_string()
        }
    }

    fn create_selection(
        &self,
        utxos: Vec<UtxoEntry>,
        target_amount: u64,
        strategy: SelectionStrategy,
    ) -> Result<UtxoSelection> {
        let total_amount: u64 = utxos.iter().map(|u| u.output.value).sum();
        let change_amount = if total_amount >= target_amount {
            total_amount - target_amount
        } else {
            0u64
        };

        Ok(UtxoSelection {
            utxos,
            total_amount,
            change_amount,
            strategy: strategy.as_str().to_string(),
        })
    }

    fn calculate_selection_score(&self, selection: &UtxoSelection) -> f64 {
        // Scoring function that considers:
        // 1. Number of UTXOs (fewer is better for transaction size)
        // 2. Change amount (less change is better)
        // 3. Privacy considerations (more UTXOs can be better for privacy)
        
        let utxo_count_penalty = selection.utxos.len() as f64 * 10.0;
        let change_penalty = selection.change_amount as f64 * 0.001;
        
        utxo_count_penalty + change_penalty
    }
}