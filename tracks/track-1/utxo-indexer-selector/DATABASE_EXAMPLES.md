# Database Storage Examples: UTXO vs Enhanced UTXO+Runes

## 🗄️ Current UTXO-Only Database Structure

### **UTXO Column Family (`utxo_cf`)**

```
Key: "b6f6991e03a1b26b4a8f61ffafb1f543a02500662ac4f4b93e5ab65b2c6dcf11:0"
Value: {
  "outpoint": {
    "txid": "b6f6991e03a1b26b4a8f61ffafb1f543a02500662ac4f4b93e5ab65b2c6dcf11",
    "vout": 0
  },
  "output": {
    "value": 5000000000,
    "script_pubkey": "76a914..."
  },
  "height": 150,
  "confirmations": 45,
  "is_coinbase": false
}
```

### **Amount Index (`amount_cf`)**

```
Key: "amount_005000000000_150_b6f6991e...:0"
Value: () // Empty value, key contains all info
```

---

## 🚀 Enhanced UTXO+Runes Database Structure

### **Enhanced UTXO Column Family (`utxo_cf`)**

```
Key: "b6f6991e03a1b26b4a8f61ffafb1f543a02500662ac4f4b93e5ab65b2c6dcf11:0"
Value: {
  "outpoint": {
    "txid": "b6f6991e03a1b26b4a8f61ffafb1f543a02500662ac4f4b93e5ab65b2c6dcf11",
    "vout": 0
  },
  "output": {
    "value": 5000000000,
    "script_pubkey": "76a914..."
  },
  "height": 150,
  "confirmations": 45,
  "is_coinbase": false,
  "runes": {
    "balances": {
      "840000:1": 1000000000,      // UNCOMMON•GOODS (1B units)
      "840001:5": 500000           // RARE•PEPE (500K units)
    }
  }
}
```

### **New Runes Column Families**

#### **Rune Info (`rune_info_cf`)**

```
Key: "840000:1" (RuneId as bytes)
Value: {
  "id": {"block": 840000, "tx": 1},
  "name": "UNCOMMON•GOODS",
  "symbol": "UG",
  "divisibility": 8,
  "spacers": 2,
  "terms": {
    "amount": 1000000000,
    "cap": 21000000,
    "height": [840000, 1050000]
  },
  "turbo": false,
  "etching_block": 840000,
  "etching_tx": 1
}
```

#### **Rune Name Index (`rune_name_cf`)**

```
Key: "uncommongoods" (normalized name as u128)
Value: "840000:1" (RuneId)
```

#### **Rune Mint Count (`rune_mints_cf`)**

```
Key: "840000:1"
Value: 15750000 (current mint count)
```

#### **Rune UTXOs by Script (`rune_utxos_cf`)**

```
Key: "76a914abc123...def456_000150_b6f6991e...:0"
    // script_pubkey + height + outpoint
Value: () // Existence key for address queries
```

#### **Rune Activity (`rune_activity_cf`)**

```
Key: "b6f6991e..._840000:1" (txid + rune_id)
Value: {
  "rune_id": {"block": 840000, "tx": 1},
  "tx_id": "b6f6991e03a1b26b4a8f61ffafb1f543a02500662ac4f4b93e5ab65b2c6dcf11",
  "address": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  "sent": 0,
  "received": 1000000000,
  "block_height": 150
}
```

---

## 🔍 Query Examples

### **Find all UTXOs for an address (with runes)**

```rust
// Query rune_utxos_cf with prefix: script_pubkey
let script_prefix = "76a914abc123...def456";
let utxo_keys = db.prefix_iterator(script_prefix);

for key in utxo_keys {
    let outpoint = extract_outpoint_from_key(key);
    let utxo = db.get_utxo(outpoint)?;
    // utxo now includes runes data
}
```

### **Find all UTXOs containing a specific rune**

```rust
// Query all UTXOs, filter by rune presence
let rune_id = RuneId::new(840000, 1);
let mut matching_utxos = Vec::new();

for utxo in all_utxos {
    if let Some(runes) = &utxo.runes {
        if runes.balances.contains_key(&rune_id) {
            matching_utxos.push(utxo);
        }
    }
}
```

### **Get rune activity for an address**

```rust
// Query rune_activity_cf by address
let activities = db.get_activities_by_address("bc1q...")?;
let rune_activities: Vec<_> = activities.into_iter()
    .filter(|a| a.rune_id == target_rune_id)
    .collect();
```

---

## 📊 Storage Efficiency Comparison

| Aspect              | UTXO-Only  | Enhanced UTXO+Runes | Overhead |
| ------------------- | ---------- | ------------------- | -------- |
| **UTXO Entry Size** | ~200 bytes | ~200-800 bytes      | +0-400%  |
| **Index Entries**   | 3 per UTXO | 5-8 per UTXO        | +67-167% |
| **Query Speed**     | Fast       | Fast (indexed)      | Minimal  |
| **Storage Growth**  | Linear     | Linear + rune data  | +20-50%  |

### **Real-world Example (Block 840,000 with 2,500 transactions)**

```
UTXO-Only Database:
├── UTXOs: 5,000 entries × 200 bytes = 1 MB
├── Amount Index: 5,000 entries × 100 bytes = 0.5 MB
├── Height Index: 5,000 entries × 80 bytes = 0.4 MB
└── Total: ~1.9 MB

Enhanced UTXO+Runes Database:
├── UTXOs: 5,000 entries × 400 bytes = 2 MB (with runes)
├── Amount Index: 5,000 entries × 100 bytes = 0.5 MB
├── Height Index: 5,000 entries × 80 bytes = 0.4 MB
├── Rune Info: 50 runes × 300 bytes = 15 KB
├── Rune UTXOs: 1,000 entries × 120 bytes = 120 KB
├── Rune Activity: 500 entries × 150 bytes = 75 KB
└── Total: ~3.1 MB (+63% overhead)
```

---

## 🎯 Benefits of Enhanced Structure

### **For Developers**

- **Single Query**: Get UTXO + runes data in one call
- **Rich Metadata**: Complete rune information attached to UTXOs
- **Efficient Filtering**: Fast queries by rune type, amount, or activity

### **For Applications**

- **Wallet Integration**: Show rune balances alongside Bitcoin
- **Trading Platforms**: List UTXOs with valuable runes
- **Analytics**: Track rune distribution and activity

### **For Performance**

- **Reduced API Calls**: One request instead of multiple
- **Cached Relationships**: Pre-computed UTXO-rune associations
- **Optimized Indexes**: Fast lookups by any criteria

This enhanced structure maintains backward compatibility while adding powerful runes capabilities, making it one of the most comprehensive Bitcoin indexing solutions available!
