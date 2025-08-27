# UTXO Indexer-Selector Testing Guide

## 🚀 Quick Start Instructions

### **1. Start Bitcoin Core (regtest)**

```bash
cd /Users/btc/bitcoin-asia-bitcoind
docker-compose up -d
```

### **2. Start UTXO Indexer-Selector**

```bash
cd utxo-indexer-selector
cargo run --release -- --mode both &
```

### **3. Wait for Initial Sync**

```bash
# Check sync progress
curl -s http://localhost:3030/stats | jq '.data.progress_percent'
```

## 🧪 Test Suite

### **Basic Health Check**

```bash
curl -s http://localhost:3030/health | jq
```

### **System Statistics**

```bash
curl -s http://localhost:3030/stats | jq '.data'
```

### **UTXO Selection Tests**

```bash
# Test largest-first algorithm
curl -s -X POST http://localhost:3030/select \
  -H "Content-Type: application/json" \
  -d '{"target_amount": 250000000, "strategy": "largest_first"}' | jq

# Test smallest-first algorithm
curl -s -X POST http://localhost:3030/select \
  -H "Content-Type: application/json" \
  -d '{"target_amount": 100000000, "strategy": "smallest_first"}' | jq

# Test branch-and-bound algorithm
curl -s -X POST http://localhost:3030/select \
  -H "Content-Type: application/json" \
  -d '{"target_amount": 500000000, "strategy": "branch_and_bound", "max_utxos": 5}' | jq
```

### **UTXO Queries**

```bash
# Get sample UTXOs
curl -s "http://localhost:3030/utxos?limit=5" | jq

# Filter by amount
curl -s "http://localhost:3030/utxos?min_amount=1000000000&limit=3" | jq

# Filter by confirmations
curl -s "http://localhost:3030/utxos?min_confirmations=100&limit=5" | jq
```

### **Analysis Endpoints**

```bash
# UTXO distribution analysis
curl -s "http://localhost:3030/analysis/distribution" | jq

# Efficiency metrics
curl -s "http://localhost:3030/analysis/efficiency" | jq
```

### **Comprehensive Demo**

```bash
./demo.sh
```

## 📊 Latest Test Results

### **System Performance (Last Test: 2025-08-27)**

- **Total UTXOs Indexed**: 6,055
- **Total Value**: 14,999.98 BTC
- **Sync Progress**: 100%
- **Database Size**: ~33MB
- **Indexing Speed**: ~6-13ms per block

### **API Response Times**

- **Health Check**: < 10ms
- **Stats Query**: < 20ms
- **UTXO Selection**: 10-50ms (depending on algorithm)
- **UTXO Queries**: 5-30ms (depending on filters)

### **Selection Algorithm Performance**

| Algorithm        | Target (BTC) | Selected UTXOs | Total (BTC) | Change (BTC) | Time (ms) |
| ---------------- | ------------ | -------------- | ----------- | ------------ | --------- |
| largest_first    | 2.5          | 1              | 50.0        | 47.5         | ~15ms     |
| smallest_first   | 1.0          | 1,624          | 1.025       | 0.025        | ~25ms     |
| branch_and_bound | 5.0          | 11             | 387.5       | 382.5        | ~20ms     |

### **Memory Usage**

- **RocksDB Storage**: 33MB
- **Application Memory**: ~50MB
- **Total System Impact**: Minimal

## 🔧 Advanced Testing

### **Load Testing**

```bash
# Concurrent API calls
for i in {1..10}; do
  curl -s http://localhost:3030/stats &
done
wait
```

### **Algorithm Comparison**

```bash
# Test all algorithms with same target
TARGET=1000000000
for algo in largest_first smallest_first oldest_first newest_first branch_and_bound; do
  echo "Testing $algo:"
  curl -s -X POST http://localhost:3030/select \
    -H "Content-Type: application/json" \
    -d "{\"target_amount\": $TARGET, \"strategy\": \"$algo\"}" | \
    jq '.data | {strategy, utxos: (.utxos | length), total_amount, change_amount}'
done
```

### **Memory Monitoring**

```bash
# Monitor memory usage while running
ps aux | grep utxo-indexer-selector
du -sh utxo_index.db
```

## 🎯 Expected Results

### **Successful Test Indicators**

- ✅ All API endpoints return HTTP 200
- ✅ Health check returns `"status": "healthy"`
- ✅ Stats show `"progress_percent": 100.0`
- ✅ UTXO selection returns valid results
- ✅ No error messages in logs
- ✅ Database grows consistently during sync

### **Performance Benchmarks**

- **Initial Sync**: < 5 minutes for ~3000 blocks
- **Block Processing**: 6-13ms per block
- **API Response**: < 100ms for most endpoints
- **Memory Usage**: < 100MB total

## 🚨 Troubleshooting

### **Common Issues**

**1. RocksDB Lock Error**

```
Error: IO error: lock hold by current process
```

**Solution**: Kill existing processes and restart

```bash
pkill -f "utxo-indexer-selector"
cargo run --release -- --mode both
```

**2. Bitcoin Core Not Running**

```
Failed to connect to Bitcoin RPC
```

**Solution**: Start Bitcoin Core

```bash
cd /Users/btc/bitcoin-asia-bitcoind
docker-compose up -d
```

**3. API Not Responding**

```
curl: (7) Failed to connect to localhost port 3030
```

**Solution**: Check if application is running

```bash
ps aux | grep utxo-indexer
```

### **Debug Commands**

```bash
# Check application logs
cargo run --release -- --mode both --log-level debug

# Check Bitcoin Core status
curl -s -u 1:1 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"1.0","id":"test","method":"getblockchaininfo","params":[]}' \
  http://127.0.0.1:8332/

# Check database size
du -sh utxo_index.db
```

## 🎉 Success Criteria

The system is working correctly when:

1. **Sync Progress**: 100%
2. **API Health**: All endpoints responding
3. **UTXO Selection**: All 8 algorithms working
4. **Database**: Growing with new blocks
5. **Performance**: Response times under 100ms
6. **Memory**: Stable usage under 100MB

**🚀 Ready for Bitcoin Asia 2025! 🚀**
