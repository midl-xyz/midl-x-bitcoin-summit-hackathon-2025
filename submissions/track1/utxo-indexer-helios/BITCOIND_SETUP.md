# Bitcoin Core Integration Guide

This guide explains how to connect the UTXO indexer to a real Bitcoin Core node (bitcoind) for production use.

## Prerequisites

1. **Bitcoin Core**: Install and sync Bitcoin Core
2. **RPC Access**: Configure RPC credentials
3. **Network Selection**: Choose mainnet, testnet, or regtest

## Bitcoin Core Setup

### 1. Install Bitcoin Core

```bash
# macOS
brew install bitcoin

# Ubuntu/Debian
sudo apt-get install bitcoind

# Or download from https://bitcoin.org/en/download
```

### 2. Configure bitcoin.conf

Create/edit `~/.bitcoin/bitcoin.conf`:

```conf
# Network (choose one)
#mainnet=1
#testnet=1
regtest=1

# RPC Settings
server=1
rpcuser=bitcoinrpc
rpcpassword=your_secure_password_here
rpcport=8332  # mainnet: 8332, testnet: 18332, regtest: 18443

# Optional: RPC allow IP
rpcallowip=127.0.0.1
rpcallowip=192.168.1.0/24  # Allow local network

# For better UTXO indexing
txindex=1  # Full transaction index
```

### 3. Start Bitcoin Core

```bash
# Start bitcoind
bitcoind -daemon

# Or with specific config
bitcoind -daemon -conf=/path/to/bitcoin.conf

# Check sync status
bitcoin-cli getblockchaininfo
```

## UTXO Indexer Setup

### 1. Environment Variables

```bash
export BITCOIN_RPC_URL="http://localhost:8332"     # Mainnet
# export BITCOIN_RPC_URL="http://localhost:18332"  # Testnet
# export BITCOIN_RPC_URL="http://localhost:18443"  # Regtest

export BITCOIN_RPC_USER="bitcoinrpc"
export BITCOIN_RPC_PASS="your_secure_password_here"
```

### 2. Run the Indexer

```bash
# Build and run
go run cmd/indexer/main.go

# Or build binary
go build -o utxo-indexer cmd/indexer/main.go
./utxo-indexer
```

## API Usage

### Get UTXOs for an Address

```bash
curl http://localhost:8081/utxos/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```

### Index Multiple Addresses

```bash
curl -X POST http://localhost:8081/index \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": [
      "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    ]
  }'
```

### Scan UTXO Set (Fast)

```bash
curl -X POST http://localhost:8081/scan \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"]
  }'
```

## Features

### Two Indexing Methods

1. **scantxoutset** (Bitcoin Core 0.17+)
   - Fast UTXO scanning without wallet
   - No blockchain rescan needed
   - Returns current UTXOs instantly

2. **importaddress + listunspent** (Fallback)
   - Works with older versions
   - Requires address import to wallet
   - Can be slower for many addresses

### Performance Tips

1. **Use scantxoutset** for one-time queries
2. **Use importaddress** for addresses you'll query repeatedly
3. **Enable txindex=1** for full transaction details
4. **Use descriptors** for efficient HD wallet scanning

## Docker Setup (Optional)

### docker-compose.yml

```yaml
version: '3.8'

services:
  bitcoind:
    image: ruimarinho/bitcoin-core:latest
    command: 
      -regtest
      -server
      -rpcuser=bitcoinrpc
      -rpcpassword=password123
      -rpcallowip=0.0.0.0/0
      -txindex
    ports:
      - "18443:18443"  # RPC port for regtest
    volumes:
      - bitcoin-data:/home/bitcoin/.bitcoin
  
  utxo-indexer:
    build: .
    environment:
      BITCOIN_RPC_URL: http://bitcoind:18443
      BITCOIN_RPC_USER: bitcoinrpc
      BITCOIN_RPC_PASS: password123
    ports:
      - "8081:8081"
    depends_on:
      - bitcoind

volumes:
  bitcoin-data:
```

### Dockerfile

```dockerfile
FROM golang:1.19-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o utxo-indexer cmd/indexer/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/utxo-indexer .
EXPOSE 8081
CMD ["./utxo-indexer"]
```

## Production Considerations

### Security
- Use strong RPC passwords
- Limit RPC access by IP
- Use HTTPS for RPC in production
- Consider using RPC authentication cookies

### Performance
- Enable txindex for full indexing
- Use SSD for blockchain storage
- Allocate sufficient RAM (4GB+)
- Monitor disk space (350GB+ for mainnet)

### High Availability
- Run multiple Bitcoin Core nodes
- Use load balancer for RPC requests
- Implement connection pooling
- Add retry logic for RPC calls

## Troubleshooting

### Connection Issues

```bash
# Test RPC connection
bitcoin-cli -rpcuser=bitcoinrpc -rpcpassword=password123 getblockcount

# Check bitcoind status
bitcoin-cli getnetworkinfo
```

### Common Errors

1. **"Failed to connect to bitcoind"**
   - Check if bitcoind is running
   - Verify RPC credentials
   - Check firewall/port settings

2. **"Method not found"**
   - Update Bitcoin Core (scantxoutset needs 0.17+)
   - Use fallback method (importaddress)

3. **"Insufficient funds"**
   - Address has no UTXOs
   - Bitcoin Core not fully synced

## Integration with Selection Algorithms

Once UTXOs are indexed from bitcoind, you can use them with the selection algorithms:

```go
// Get UTXOs from bitcoind
utxos := IndexUTXOs(rpc, addresses)

// Use with selection algorithms
selector := NewSelector(utxos)
selected := selector.OptimizeFee3(amount, feeRate)  // Knapsack DP
```

This provides real-time UTXO data for optimal transaction construction!