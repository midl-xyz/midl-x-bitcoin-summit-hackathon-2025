use anyhow::{anyhow, Result};

use std::collections::HashMap;

use crate::types::UtxoEntry;

/// Largest-first selection algorithm
/// Selects the largest UTXOs first until the target is reached
pub fn largest_first_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    // Filter out zero-value UTXOs and sort by value (largest first)
    let mut sorted_utxos: Vec<UtxoEntry> = utxos.iter()
        .filter(|utxo| utxo.output.value > 0)
        .cloned()
        .collect();
    sorted_utxos.sort_by(|a, b| b.output.value.cmp(&a.output.value));

    let mut selected = Vec::new();
    let mut total = 0u64;

    for utxo in sorted_utxos {
        total += utxo.output.value;
        selected.push(utxo);

        if total >= target_amount {
            break;
        }
    }

    if total < target_amount {
        return Err(anyhow!("Insufficient funds: {} < {}", total, target_amount));
    }

    Ok(selected)
}

/// Smallest-first selection algorithm
/// Selects the smallest UTXOs first to minimize change
pub fn smallest_first_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    // Filter out zero-value UTXOs and sort by value
    let mut sorted_utxos: Vec<UtxoEntry> = utxos.iter()
        .filter(|utxo| utxo.output.value > 0)
        .cloned()
        .collect();
    sorted_utxos.sort_by(|a, b| a.output.value.cmp(&b.output.value));

    let mut selected = Vec::new();
    let mut total = 0u64;

    for utxo in sorted_utxos {
        total += utxo.output.value;
        selected.push(utxo);

        if total >= target_amount {
            break;
        }
    }

    if total < target_amount {
        return Err(anyhow!("Insufficient funds: {} < {}", total, target_amount));
    }

    Ok(selected)
}

/// Oldest-first selection algorithm
/// Selects UTXOs with the most confirmations first
pub fn oldest_first_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    let mut sorted_utxos = utxos.to_vec();
    sorted_utxos.sort_by(|a, b| b.confirmations.cmp(&a.confirmations));

    let mut selected = Vec::new();
    let mut total = 0u64;

    for utxo in sorted_utxos {
        total += utxo.output.value;
        selected.push(utxo);

        if total >= target_amount {
            break;
        }
    }

    if total < target_amount {
        return Err(anyhow!("Insufficient funds: {} < {}", total, target_amount));
    }

    Ok(selected)
}

/// Newest-first selection algorithm
/// Selects UTXOs with the fewest confirmations first
pub fn newest_first_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    let mut sorted_utxos = utxos.to_vec();
    sorted_utxos.sort_by(|a, b| a.confirmations.cmp(&b.confirmations));

    let mut selected = Vec::new();
    let mut total = 0u64;

    for utxo in sorted_utxos {
        total += utxo.output.value;
        selected.push(utxo);

        if total >= target_amount {
            break;
        }
    }

    if total < target_amount {
        return Err(anyhow!("Insufficient funds: {} < {}", total, target_amount));
    }

    Ok(selected)
}

/// Branch and bound selection algorithm
/// Attempts to find an exact match or minimal change solution
pub fn branch_and_bound_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    // Filter out zero-value UTXOs first
    let valid_utxos: Vec<UtxoEntry> = utxos.iter()
        .filter(|utxo| utxo.output.value > 0)
        .cloned()
        .collect();

    // First try to find an exact match
    if let Some(exact_utxo) = valid_utxos.iter().find(|u| u.output.value == target_amount) {
        return Ok(vec![exact_utxo.clone()]);
    }

    // Sort UTXOs by value for better pruning
    let mut sorted_utxos = valid_utxos;
    sorted_utxos.sort_by(|a, b| b.output.value.cmp(&a.output.value));

    let target_sat = target_amount;
    let mut best_solution: Option<Vec<UtxoEntry>> = None;
    let mut best_waste = u64::MAX;

    // Try branch and bound with a reasonable limit
    let max_combinations = std::cmp::min(1000, 1 << std::cmp::min(sorted_utxos.len(), 20));
    
    for i in 1..max_combinations {
        let mut combination = Vec::new();
        let mut total_sat = 0u64;
        
        for (j, utxo) in sorted_utxos.iter().enumerate() {
            if (i >> j) & 1 == 1 {
                combination.push(utxo.clone());
                total_sat += utxo.output.value;
                
                // Early termination if we exceed reasonable limits
                if combination.len() > 10 {
                    break;
                }
            }
        }

        if total_sat >= target_sat {
            let waste = total_sat - target_sat;
            if waste < best_waste {
                best_waste = waste;
                best_solution = Some(combination);
                
                // Perfect solution found
                if waste == 0 {
                    break;
                }
            }
        }
    }

    // If branch and bound didn't find a good solution, fall back to largest-first
    best_solution
        .or_else(|| largest_first_selection(&sorted_utxos, target_amount).ok())
        .ok_or_else(|| anyhow!("Could not find suitable UTXO combination"))
}

/// Single Random Draw selection
/// Randomly selects UTXOs until target is reached
pub fn single_random_draw_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    use rand::seq::SliceRandom;
    use rand::thread_rng;

    let mut shuffled_utxos = utxos.to_vec();
    shuffled_utxos.shuffle(&mut thread_rng());

    let mut selected = Vec::new();
    let mut total = 0u64;

    for utxo in shuffled_utxos {
        total += utxo.output.value;
        selected.push(utxo);

        if total >= target_amount {
            break;
        }
    }

    if total < target_amount {
        return Err(anyhow!("Insufficient funds: {} < {}", total, target_amount));
    }

    Ok(selected)
}

/// Knapsack-like selection with approximation
/// Uses dynamic programming approach for better solutions
pub fn knapsack_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
) -> Result<Vec<UtxoEntry>> {
    let target_sat = target_amount;
    
    // Limit the problem size for performance
    let max_utxos = std::cmp::min(utxos.len(), 50);
    let utxos_subset = &utxos[..max_utxos];
    
    // Create a DP table
    let mut dp: HashMap<u64, Vec<usize>> = HashMap::new();
    dp.insert(0, Vec::new());

    for (i, utxo) in utxos_subset.iter().enumerate() {
        let value = utxo.output.value;
        let mut new_states: HashMap<u64, Vec<usize>> = HashMap::new();

        for (&current_sum, indices) in dp.iter() {
            let new_sum = current_sum + value;
            if new_sum <= target_sat * 2 { // Don't go too far over target
                let mut new_indices = indices.clone();
                new_indices.push(i);
                
                // Only keep this state if it's better than existing ones
                match new_states.get(&new_sum) {
                    Some(existing) if existing.len() <= new_indices.len() => {
                        // Keep existing shorter solution
                    }
                    _ => {
                        new_states.insert(new_sum, new_indices);
                    }
                }
            }
        }

        dp.extend(new_states);
        
        // Limit DP table size to prevent memory explosion
        if dp.len() > 10000 {
            // Keep only the most promising states
            let mut states: Vec<_> = dp.into_iter().collect();
            states.sort_by_key(|(sum, indices)| {
                let distance_from_target = if *sum >= target_sat {
                    *sum - target_sat
                } else {
                    target_sat - *sum + 1000000 // Penalty for being under target
                };
                (distance_from_target, indices.len())
            });
            
            dp = states.into_iter().take(5000).collect();
        }
    }

    // Find the best solution (>= target with minimal overpay)
    let best_solution = dp.iter()
        .filter(|(&sum, _)| sum >= target_sat)
        .min_by_key(|(&sum, indices)| (sum - target_sat, indices.len()));

    match best_solution {
        Some((_, indices)) => {
            let selected: Vec<UtxoEntry> = indices.iter()
                .map(|&i| utxos_subset[i].clone())
                .collect();
            Ok(selected)
        }
        None => {
            // Fallback to largest-first if no solution found
            largest_first_selection(utxos, target_amount)
        }
    }
}

/// Effective value selection considering transaction fees
/// Selects UTXOs based on their effective value after accounting for input and output costs
pub fn effective_value_selection(
    utxos: &[UtxoEntry],
    target_amount: u64,
    fee_rate_sat_per_vbyte: f64,
    output_count: Option<usize>,
) -> Result<Vec<UtxoEntry>> {
    // Estimate input size based on script type
    let estimate_input_size = |utxo: &UtxoEntry| -> u32 {
        if utxo.output.script_pubkey.is_v0_p2wpkh() {
            68 // P2WPKH input size (31 + 4 + 1 + 32 = 68 vbytes)
        } else if utxo.output.script_pubkey.is_p2pkh() {
            148 // P2PKH input size (32 + 4 + 1 + 107 + 4 = 148 vbytes)
        } else if utxo.output.script_pubkey.is_p2sh() {
            91 // P2SH-P2WPKH input size (estimate)
        } else if utxo.output.script_pubkey.is_v1_p2tr() {
            57 // P2TR input size (32 + 4 + 1 + 16 + 4 = 57 vbytes)
        } else {
            100 // Conservative estimate for other types
        }
    };

    // Estimate output fee (outputs are typically 34 bytes for P2WPKH, 43 for P2TR)
    let output_fee = if let Some(count) = output_count {
        (count as f64 * 34.0 * fee_rate_sat_per_vbyte) as u64
    } else {
        (2.0 * 34.0 * fee_rate_sat_per_vbyte) as u64 // Default to 2 outputs (payment + change)
    };

    // Base transaction overhead (10 vbytes)
    let base_fee = (10.0 * fee_rate_sat_per_vbyte) as u64;

    // Target amount including estimated output and base fees
    let adjusted_target = target_amount + output_fee + base_fee;

    // Calculate effective values
    let mut effective_utxos: Vec<(UtxoEntry, i64, u64)> = utxos.iter()
        .map(|utxo| {
            let input_size = estimate_input_size(utxo);
            let input_fee = (input_size as f64 * fee_rate_sat_per_vbyte) as u64;
            let effective_value = utxo.output.value as i64 - input_fee as i64;
            (utxo.clone(), effective_value, input_fee)
        })
        .filter(|(_, effective_value, _)| *effective_value > 0) // Only positive effective values
        .collect();

    // Sort by effective value (largest first)
    effective_utxos.sort_by(|a, b| b.1.cmp(&a.1));

    let mut selected = Vec::new();
    let mut total_value = 0u64;
    let mut total_input_fees = 0u64;

    for (utxo, _effective_value, input_fee) in effective_utxos {
        selected.push(utxo.clone());
        total_value += utxo.output.value;
        total_input_fees += input_fee;

        // Check if we have enough to cover target + all fees
        if total_value >= adjusted_target + total_input_fees {
            break;
        }
    }

    let total_fees = total_input_fees + output_fee + base_fee;
    if total_value < target_amount + total_fees {
        return Err(anyhow!(
            "Insufficient funds: need {} (target) + {} (fees) = {}, have {}",
            target_amount, total_fees, target_amount + total_fees, total_value
        ));
    }

    Ok(selected)
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::{OutPoint, TxOut, ScriptBuf, Txid};

    fn create_test_utxo(value_sat: u64, confirmations: u64) -> UtxoEntry {
        UtxoEntry {
            outpoint: OutPoint {
                txid: Txid::all_zeros(),
                vout: 0,
            },
            output: TxOut {
                value: Amount::from_sat(value_sat),
                script_pubkey: ScriptBuf::new(),
            },
            block_height: 100 - confirmations,
            block_hash: "test".to_string(),
            is_coinbase: false,
            confirmations,
        }
    }

    #[test]
    fn test_largest_first_selection() {
        let utxos = vec![
            create_test_utxo(1000, 10),
            create_test_utxo(2000, 5),
            create_test_utxo(500, 15),
        ];

        let target = Amount::from_sat(1500);
        let result = largest_first_selection(&utxos, target).unwrap();
        
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].output.value, 2000);
    }

    #[test]
    fn test_smallest_first_selection() {
        let utxos = vec![
            create_test_utxo(1000, 10),
            create_test_utxo(2000, 5),
            create_test_utxo(500, 15),
        ];

        let target = Amount::from_sat(1200);
        let result = smallest_first_selection(&utxos, target).unwrap();
        
        assert_eq!(result.len(), 2);
        assert_eq!(result[0].output.value, 500);
        assert_eq!(result[1].output.value, 1000);
    }

    #[test]
    fn test_branch_and_bound_exact_match() {
        let utxos = vec![
            create_test_utxo(1000, 10),
            create_test_utxo(2000, 5),
            create_test_utxo(500, 15),
        ];

        let target = Amount::from_sat(1000);
        let result = branch_and_bound_selection(&utxos, target).unwrap();
        
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].output.value, 1000);
    }
}