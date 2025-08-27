use bitcoin::ScriptBuf;
use crate::types::UtxoEntry;

/// Fee estimation utilities for Bitcoin transactions
pub struct FeeEstimator;

impl FeeEstimator {
    /// Estimate the size of a transaction input based on script type
    pub fn estimate_input_size(script: &ScriptBuf) -> u32 {
        if script.is_v0_p2wpkh() {
            68 // P2WPKH input: 31 vbytes witness + 32 prevout + 4 sequence + 1 script_len = 68 vbytes
        } else if script.is_p2pkh() {
            148 // P2PKH input: 32 prevout + 4 sequence + 1 script_len + 107 script + 4 = 148 vbytes
        } else if script.is_p2sh() {
            // Assume P2SH-P2WPKH (most common)
            91 // 32 prevout + 4 sequence + 1 script_len + 22 redeem_script + 32 witness = 91 vbytes
        } else if script.is_v1_p2tr() {
            57 // P2TR input: 32 prevout + 4 sequence + 1 script_len + 16 witness + 4 = 57 vbytes
        } else if script.is_v0_p2wsh() {
            104 // P2WSH input (conservative estimate)
        } else if script.is_v1_p2tr() {
            57 // P2TR key-path spend
        } else {
            120 // Conservative estimate for unknown script types
        }
    }

    /// Estimate the size of a transaction output based on script type
    pub fn estimate_output_size(script: &ScriptBuf) -> u32 {
        if script.is_v0_p2wpkh() {
            31 // P2WPKH output: 8 value + 1 script_len + 22 script = 31 bytes
        } else if script.is_p2pkh() {
            34 // P2PKH output: 8 value + 1 script_len + 25 script = 34 bytes
        } else if script.is_p2sh() {
            32 // P2SH output: 8 value + 1 script_len + 23 script = 32 bytes
        } else if script.is_v1_p2tr() {
            43 // P2TR output: 8 value + 1 script_len + 34 script = 43 bytes
        } else if script.is_v0_p2wsh() {
            43 // P2WSH output: 8 value + 1 script_len + 34 script = 43 bytes
        } else {
            40 // Conservative estimate for unknown script types
        }
    }

    /// Estimate the size of a transaction input for a UTXO
    pub fn estimate_utxo_input_size(utxo: &UtxoEntry) -> u32 {
        Self::estimate_input_size(&utxo.output.script_pubkey)
    }

    /// Calculate the fee for spending a UTXO at a given fee rate
    pub fn calculate_input_fee(utxo: &UtxoEntry, fee_rate_sat_per_vbyte: f64) -> u64 {
        let input_size = Self::estimate_utxo_input_size(utxo);
        (input_size as f64 * fee_rate_sat_per_vbyte).ceil() as u64
    }

    /// Calculate the effective value of a UTXO (value minus input fee)
    pub fn calculate_effective_value(utxo: &UtxoEntry, fee_rate_sat_per_vbyte: f64) -> i64 {
        let input_fee = Self::calculate_input_fee(utxo, fee_rate_sat_per_vbyte);
        utxo.output.value as i64 - input_fee as i64
    }

    /// Estimate total transaction size
    pub fn estimate_transaction_size(
        input_count: usize,
        output_scripts: &[ScriptBuf],
        has_witness: bool,
    ) -> u32 {
        let mut size = 0u32;

        // Transaction overhead
        size += 4; // version
        size += 4; // locktime
        size += Self::var_int_size(input_count as u64); // input count
        size += Self::var_int_size(output_scripts.len() as u64); // output count

        // Witness overhead if any inputs use witness
        if has_witness {
            size += 2; // witness flag and marker
        }

        // Assume average input size (conservative P2WPKH)
        size += input_count as u32 * 68;

        // Calculate output sizes
        for script in output_scripts {
            size += Self::estimate_output_size(script);
        }

        size
    }

    /// Estimate transaction fee
    pub fn estimate_transaction_fee(
        utxos: &[UtxoEntry],
        output_scripts: &[ScriptBuf],
        fee_rate_sat_per_vbyte: f64,
    ) -> u64 {
        let mut total_size = 0u32;

        // Transaction overhead
        total_size += 4; // version
        total_size += 4; // locktime
        total_size += Self::var_int_size(utxos.len() as u64); // input count
        total_size += Self::var_int_size(output_scripts.len() as u64); // output count

        // Check if any input uses witness
        let has_witness = utxos.iter().any(|utxo| {
            utxo.output.script_pubkey.is_v0_p2wpkh() 
                || utxo.output.script_pubkey.is_v0_p2wsh()
                || utxo.output.script_pubkey.is_v1_p2tr()
        });

        if has_witness {
            total_size += 2; // witness flag and marker
        }

        // Input sizes
        for utxo in utxos {
            total_size += Self::estimate_utxo_input_size(utxo);
        }

        // Output sizes
        for script in output_scripts {
            total_size += Self::estimate_output_size(script);
        }

        (total_size as f64 * fee_rate_sat_per_vbyte).ceil() as u64
    }

    /// Get current recommended fee rates (in practice, this would query a fee estimation service)
    pub fn get_recommended_fee_rates() -> FeeRates {
        FeeRates {
            fast: 20.0,      // ~10 minutes
            normal: 10.0,    // ~30 minutes  
            slow: 5.0,       // ~1 hour
            minimum: 1.0,    // Eventually
        }
    }

    /// Calculate variable integer encoding size
    fn var_int_size(value: u64) -> u32 {
        match value {
            0..=0xFC => 1,
            0xFD..=0xFFFF => 3,
            0x10000..=0xFFFFFFFF => 5,
            _ => 9,
        }
    }

    /// Check if a UTXO is economical to spend at a given fee rate
    pub fn is_economical_to_spend(utxo: &UtxoEntry, fee_rate_sat_per_vbyte: f64) -> bool {
        Self::calculate_effective_value(utxo, fee_rate_sat_per_vbyte) > 0
    }

    /// Calculate dust threshold for a given script type and fee rate
    pub fn calculate_dust_threshold(script: &ScriptBuf, fee_rate_sat_per_vbyte: f64) -> u64 {
        // Dust threshold is typically 3x the cost to spend the output
        let input_size = Self::estimate_input_size(script);
        let cost_to_spend = (input_size as f64 * fee_rate_sat_per_vbyte).ceil() as u64;
        cost_to_spend * 3
    }
}

/// Fee rate recommendations
#[derive(Debug, Clone)]
pub struct FeeRates {
    pub fast: f64,    // sat/vbyte for fast confirmation
    pub normal: f64,  // sat/vbyte for normal confirmation
    pub slow: f64,    // sat/vbyte for slow confirmation
    pub minimum: f64, // sat/vbyte minimum relay fee
}

#[cfg(test)]
mod tests {
    use super::*;
    use bitcoin::{OutPoint, TxOut, ScriptBuf, Txid};
    use std::str::FromStr;

    fn create_test_utxo(script: ScriptBuf, value: u64) -> UtxoEntry {
        UtxoEntry {
            outpoint: OutPoint {
                txid: Txid::from_str("0000000000000000000000000000000000000000000000000000000000000000").unwrap(),
                vout: 0,
            },
            output: TxOut { value, script_pubkey: script },
            block_height: 800000,
            block_hash: "test".to_string(),
            is_coinbase: false,
            confirmations: 6,
            address: None,
            script_type: "test".to_string(),
        }
    }

    #[test]
    fn test_input_size_estimation() {
        // P2WPKH
        let p2wpkh_script = ScriptBuf::new_v0_p2wpkh(&[0u8; 20]);
        assert_eq!(FeeEstimator::estimate_input_size(&p2wpkh_script), 68);

        // P2PKH  
        let p2pkh_script = ScriptBuf::new_p2pkh(&[0u8; 20]);
        assert_eq!(FeeEstimator::estimate_input_size(&p2pkh_script), 148);
    }

    #[test]
    fn test_effective_value_calculation() {
        let script = ScriptBuf::new_v0_p2wpkh(&[0u8; 20]);
        let utxo = create_test_utxo(script, 100000); // 1000 sats
        
        let effective_value = FeeEstimator::calculate_effective_value(&utxo, 10.0);
        // 100000 - (68 * 10) = 100000 - 680 = 99320
        assert_eq!(effective_value, 99320);
    }

    #[test]
    fn test_economical_to_spend() {
        let script = ScriptBuf::new_v0_p2wpkh(&[0u8; 20]);
        
        // Large UTXO should be economical
        let large_utxo = create_test_utxo(script.clone(), 100000);
        assert!(FeeEstimator::is_economical_to_spend(&large_utxo, 10.0));
        
        // Small UTXO might not be economical at high fee rates
        let small_utxo = create_test_utxo(script, 500);
        assert!(!FeeEstimator::is_economical_to_spend(&small_utxo, 10.0));
    }
}