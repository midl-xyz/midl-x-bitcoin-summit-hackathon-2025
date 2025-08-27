# API Documentation

## Overview

The UTXO Indexer API provides comprehensive endpoints for Bitcoin UTXO management, selection, and analysis. The API is RESTful and returns JSON responses.

## Base URLs

- **Demo Server**: `http://localhost:8081/api/v1`
- **Production Server**: `http://localhost:8080/api/v1`
- **Alchemy Service**: `http://localhost:8082` (standalone)

## Authentication

Currently, the API does not require authentication for public endpoints. Future versions will include API key authentication for production use.

## Endpoints

### 1. Get UTXOs for Address

Retrieve all unspent transaction outputs for a specific Bitcoin address.

**Endpoint**: `GET /utxos/:address`

**Parameters**:
- `address` (path): Bitcoin address (P2PKH, P2SH, P2WPKH, P2WSH)

**Example Request**:
```bash
curl http://localhost:8081/api/v1/utxos/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```

**Example Response**:
```json
{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "utxos": [
    {
      "txid": "abc123...",
      "vout": 0,
      "value": 100000,
      "block_height": 850000,
      "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
      "spent": false
    }
  ],
  "total_value": 500000,
  "count": 5
}
```

### 2. Select UTXOs

Select optimal UTXOs for a transaction using specified algorithm.

**Endpoint**: `POST /select`

**Request Body**:
```json
{
  "address": "string",
  "amount": 100000,
  "fee_rate": 10,
  "algorithm": "optimize_fee_3"
}
```

**Parameters**:
- `address` (string): Bitcoin address
- `amount` (int64): Target amount in satoshis
- `fee_rate` (int64): Fee rate in sat/vByte
- `algorithm` (string): Selection algorithm
  - `optimize_fee_1`: Effective Value Algorithm
  - `optimize_fee_2`: Branch and Bound
  - `optimize_fee_3`: Knapsack DP (Best efficiency)
  - `optimize_fee_4`: Single Random Draw
  - `optimize_fee_5`: Accumulative
  - `optimize_fee_6`: Genetic Algorithm

**Example Request**:
```bash
curl -X POST http://localhost:8081/api/v1/select \
  -H "Content-Type: application/json" \
  -d '{
    "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "amount": 100000,
    "fee_rate": 10,
    "algorithm": "optimize_fee_3"
  }'
```

**Example Response**:
```json
{
  "success": true,
  "algorithm": "optimize_fee_3",
  "selected_utxos": [
    {
      "txid": "abc123...",
      "vout": 0,
      "value": 150000
    }
  ],
  "total_input": 150000,
  "total_output": 100000,
  "fee": 1500,
  "change": 48500,
  "efficiency_score": 0.91
}
```

### 3. Multi-Address UTXO Selection

Select UTXOs from multiple addresses simultaneously for enhanced privacy and optimization.

**Endpoint**: `POST /multi-select`

**Request Body**:
```json
{
  "addresses": ["address1", "address2"],
  "amount": 500000,
  "fee_rate": 20,
  "algorithm": "optimize_fee_6"
}
```

**Example Response**:
```json
{
  "success": true,
  "algorithm": "optimize_fee_6",
  "address_breakdown": {
    "bc1qxy2...": {
      "selected_count": 2,
      "total_value": 300000
    },
    "bc1qm34...": {
      "selected_count": 1,
      "total_value": 250000
    }
  },
  "selected_utxos": [...],
  "total_input": 550000,
  "total_output": 500000,
  "fee": 3000,
  "change": 47000
}
```

### 4. Get Balance

Get the total balance for an address.

**Endpoint**: `GET /balance/:address`

**Example Request**:
```bash
curl http://localhost:8081/api/v1/balance/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh
```

**Example Response**:
```json
{
  "address": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
  "balance": 500000,
  "utxo_count": 5,
  "unit": "satoshis"
}
```

### 5. Get Multi-Address Summary

Get aggregated information for multiple addresses.

**Endpoint**: `POST /multi-summary`

**Request Body**:
```json
{
  "addresses": [
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h"
  ]
}
```

**Example Response**:
```json
{
  "total_balance": 1500000,
  "total_utxos": 12,
  "address_details": {
    "bc1qxy2...": {
      "balance": 500000,
      "utxo_count": 5
    },
    "bc1qm34...": {
      "balance": 1000000,
      "utxo_count": 7
    }
  }
}
```

### 6. Get Statistics

Get system-wide statistics and performance metrics.

**Endpoint**: `GET /stats`

**Example Response**:
```json
{
  "total_addresses": 150,
  "total_utxos": 3500,
  "total_value": 125000000,
  "algorithm_performance": {
    "optimize_fee_1": {
      "avg_efficiency": 0.65,
      "avg_time_ms": 12
    },
    "optimize_fee_3": {
      "avg_efficiency": 0.91,
      "avg_time_ms": 287
    },
    "optimize_fee_6": {
      "avg_efficiency": 0.86,
      "avg_time_ms": 1200
    }
  },
  "last_update": "2024-03-15T10:30:00Z"
}
```

### 7. Health Check

Check API server health status.

**Endpoint**: `GET /health`

**Example Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime_seconds": 3600,
  "database": "connected",
  "redis": "connected"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

**Common Error Codes**:
- `INVALID_ADDRESS`: Invalid Bitcoin address format
- `INSUFFICIENT_FUNDS`: Not enough UTXOs to fulfill request
- `ALGORITHM_NOT_FOUND`: Specified algorithm doesn't exist
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Burst**: 10 requests per second allowed
- Headers returned:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## WebSocket Support (Coming Soon)

Real-time UTXO updates via WebSocket:

**Endpoint**: `ws://localhost:8080/api/v1/ws`

**Subscribe to address updates**:
```json
{
  "action": "subscribe",
  "addresses": ["bc1qxy2..."]
}
```

## Algorithm Performance Comparison

| Algorithm | ID | Efficiency | Speed | Best For |
|-----------|-----|-----------|-------|----------|
| Knapsack DP | optimize_fee_3 | 91% | Medium | Maximum fee savings |
| Genetic Algorithm | optimize_fee_6 | 86% | Slow | Large UTXO sets |
| Branch & Bound | optimize_fee_2 | 78% | Fast | Exact matching |
| Effective Value | optimize_fee_1 | 65% | Very Fast | Real-time selection |
| Single Random | optimize_fee_4 | Variable | Fast | Privacy enhancement |
| Accumulative | optimize_fee_5 | 70% | Fast | Balanced selection |

## SDK Examples

### JavaScript/TypeScript
```javascript
const response = await fetch('http://localhost:8081/api/v1/select', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    amount: 100000,
    fee_rate: 10,
    algorithm: 'optimize_fee_3'
  })
});

const result = await response.json();
console.log(`Selected ${result.selected_utxos.length} UTXOs`);
console.log(`Total fee: ${result.fee} satoshis`);
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:8081/api/v1/select',
    json={
        'address': 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        'amount': 100000,
        'fee_rate': 10,
        'algorithm': 'optimize_fee_3'
    }
)

result = response.json()
print(f"Selected {len(result['selected_utxos'])} UTXOs")
print(f"Total fee: {result['fee']} satoshis")
```

## Testing

Test the API using the provided test script:

```bash
./scripts/test_api.sh
```

Or use curl for individual endpoints:

```bash
# Test UTXO retrieval
curl http://localhost:8081/api/v1/utxos/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh | jq

# Test UTXO selection with Knapsack algorithm
curl -X POST http://localhost:8081/api/v1/select \
  -H "Content-Type: application/json" \
  -d '{"address":"bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh","amount":100000,"fee_rate":10,"algorithm":"optimize_fee_3"}' | jq
```

## Support

For issues or questions:
- GitHub Issues: [https://github.com/helios/utxo-indexer/issues](https://github.com/helios/utxo-indexer/issues)
- Email: support@example.com