# Alchemy Bitcoin API Integration

## Overview

The UTXO Indexer now supports integration with Alchemy's Bitcoin API for real-time blockchain data access without running a full Bitcoin node.

## Features

- **Real-time UTXO queries** - Get unspent transaction outputs for any Bitcoin address
- **Balance checking** - Query address balances directly from the blockchain
- **Multi-address support** - Query multiple addresses in a single request
- **UTXO selection** - Smart selection algorithms for transaction building
- **Block height tracking** - Monitor current blockchain height

## Configuration

### Environment Variables

```bash
# Required for Alchemy integration
export ALCHEMY_API_KEY="your-alchemy-api-key"

# Optional - for main API server
export DATABASE_URL="postgres://user:pass@localhost:5432/utxo_indexer"
export REDIS_ADDR="localhost:6379"
export PORT="8080"
```

### Getting an Alchemy API Key

1. Sign up at [Alchemy.com](https://www.alchemy.com/)
2. Create a new Bitcoin Mainnet app
3. Copy your API key from the dashboard

## API Endpoints

All Alchemy endpoints are available under `/api/v1/alchemy` when the service is enabled.

### Get UTXOs for Address
```bash
GET /api/v1/alchemy/utxos/:address

# Example
curl http://localhost:8080/api/v1/alchemy/utxos/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh

# Response
{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "utxos": [
    {
      "txid": "...",
      "vout": 0,
      "value": 100000,
      "block_height": 800000,
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "spent": false
    }
  ],
  "count": 5
}
```

### Get Balance
```bash
GET /api/v1/alchemy/balance/:address

# Example
curl http://localhost:8080/api/v1/alchemy/balance/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

# Response
{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "balance": 5000000000
}
```

### Get Block Height
```bash
GET /api/v1/alchemy/block/height

# Response
{
  "height": 850000
}
```

### Select UTXOs for Transaction
```bash
POST /api/v1/alchemy/select
Content-Type: application/json

{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "amount": 100000,
  "fee_rate": 10
}

# Response
{
  "selected_utxos": [...],
  "total_value": 150000,
  "amount": 100000,
  "estimated_fee": 2000,
  "change": 48000,
  "num_inputs": 2
}
```

### Get UTXOs for Multiple Addresses
```bash
POST /api/v1/alchemy/multi-utxos
Content-Type: application/json

{
  "addresses": [
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
  ]
}

# Response
{
  "results": {
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh": [...],
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": [...]
  }
}
```

## Running the Services

### Option 1: Main API Server with Alchemy Integration

```bash
# Set environment variables
export ALCHEMY_API_KEY="your-api-key"
export DATABASE_URL="postgres://..."
export REDIS_ADDR="localhost:6379"

# Run the main API server
go run cmd/api/main.go
```

### Option 2: Standalone Alchemy Service

```bash
# Set API key
export ALCHEMY_API_KEY="your-api-key"

# Run standalone Alchemy service (port 8082)
go run cmd/alchemy/main.go
```

## Testing

Run the test script to verify the integration:

```bash
# Make sure the service is running first
./scripts/test_alchemy.sh
```

## Architecture

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   API Gateway   │
│   (port 8080)   │
├─────────────────┤
│ /api/v1/*       │ ──> Local DB + Redis
│ /api/v1/alchemy │ ──> Alchemy Service
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Alchemy Service │
├─────────────────┤
│ - GetUTXOs      │
│ - GetBalance    │
│ - SelectUTXOs   │
│ - BlockHeight   │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Alchemy API    │
│ (Bitcoin RPC)   │
└─────────────────┘
```

## Performance Considerations

- **Rate Limits**: Alchemy has rate limits based on your plan
- **Caching**: Consider implementing Redis caching for frequently accessed data
- **Batch Requests**: Use multi-address endpoints to reduce API calls
- **Connection Pooling**: The service uses HTTP connection pooling for efficiency

## Security

- **API Key Protection**: Never commit API keys to version control
- **Environment Variables**: Always use environment variables for sensitive configuration
- **HTTPS**: Use HTTPS in production environments
- **Rate Limiting**: Implement rate limiting to prevent abuse

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Verify your API key is correct
   - Check if the key is for Bitcoin Mainnet

2. **Connection Timeout**
   - Check network connectivity
   - Verify Alchemy service status

3. **No UTXOs Found**
   - Verify the address format is correct
   - Check if the address has any transactions

## Support

For issues or questions:
- Check Alchemy documentation: https://docs.alchemy.com/
- Open an issue on GitHub
- Contact support team