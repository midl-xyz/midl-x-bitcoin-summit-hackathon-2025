# System Architecture Documentation

## Overview

The UTXO Indexer-Selector is designed as a high-performance Bitcoin UTXO management system featuring 6 advanced selection algorithms and multi-address support. The architecture supports both demo (in-memory) and production (persistent) deployment modes.

## Current Implementation (In-Memory Demo)

```
┌─────────────────────┐
│   Client Apps       │
│  (Web, Mobile)      │
└──────────┬──────────┘
           │ REST API
           │
┌──────────▼──────────┐
│   Demo Server       │
│   (Gin HTTP)        │
│  ┌──────────────┐   │
│  │ UTXO Storage │   │◄──── In-Memory Storage
│  │   (sync.Map) │   │      1,746 UTXOs
│  └──────────────┘   │      5 Test Wallets
│  ┌──────────────┐   │
│  │   Selector   │   │◄──── 6 Advanced Algorithms
│  │   Engine     │   │      Multi-Address Support
│  └──────────────┘   │
└─────────────────────┘
           │
           │ File I/O & Live API
           ▼
    ┌──────────┐    ┌─────────────────┐
    │utxos.txt │    │  Live API       │
    │test_     │◄───│ mempool.regtest │
    │wallets   │    │ .midl.xyz      │
    └──────────┘    └─────────────────┘
```

### Key Components

#### 1. **HTTP Server (Gin Framework)**
- **Purpose**: RESTful API server with Swagger documentation
- **Features**: 
  - CORS support for cross-origin requests
  - JSON request/response handling
  - Error handling and validation
  - Swagger UI integration

#### 2. **UTXO Storage Layer**
- **Type**: In-memory storage using `sync.Map`
- **Capacity**: 1,746 UTXOs across 5 test addresses
- **Features**:
  - Thread-safe concurrent access
  - O(1) lookup performance
  - Real-time state management (spent/unspent)

#### 3. **Selection Engine**
- **Algorithms**: 6 advanced UTXO selection strategies
- **Features**:
  - Single address optimization
  - Multi-address integration
  - Performance benchmarking
  - Algorithm comparison

#### 4. **Data Sources**
- **Primary**: Live API (mempool.regtest.midl.xyz)
- **Fallback**: Local JSON files (utxos.txt, test_wallets.json)
- **Test Data**: 5 different wallet scenarios

## Algorithm Architecture

### 1. **Core Selection Algorithms**

```
┌─────────────────────────────────────┐
│           Selector Engine           │
├─────────────────────────────────────┤
│ optimize_fee_1: Effective Value     │◄── Fast Processing
│ optimize_fee_2: Branch & Bound      │◄── Exact Matching
│ optimize_fee_3: Knapsack DP         │◄── Highest Efficiency
│ optimize_fee_4: Single Random       │◄── Privacy Enhancement
│ optimize_fee_5: Accumulative        │◄── Balanced Selection
│ optimize_fee_6: Enhanced GA         │◄── Smart Optimization
└─────────────────────────────────────┘
```

### 2. **Multi-Address Integration**

```
┌─────────────────────────────────────┐
│        Multi-Address Engine         │
├─────────────────────────────────────┤
│  Address 1 UTXOs ─┐                │
│  Address 2 UTXOs ─┼─► Unified Pool │◄── All 6 Algorithms
│  Address 3 UTXOs ─┘                │    Support
│  ...              │                │
└─────────────────────────────────────┘
```

## Production Architecture (Future Implementation)

```
┌─────────────────────┐
│   Client Apps       │
└──────────┬──────────┘
           │ REST/WebSocket
┌──────────▼──────────┐
│   API Gateway       │◄──── Load Balancing
│   (Kong/Nginx)      │      Rate Limiting
└──────────┬──────────┘      SSL Termination
           │
┌──────────▼──────────┐
│   API Service       │◄──── Multiple Instances
│   (Gin/Fiber)       │      Auto-scaling
└──────────┬──────────┘      Health Checks
           │
┌──────────▼──────────┐
│   Business Logic    │
│  ┌──────────────┐   │
│  │   UTXO       │   │◄──── Redis Cache Layer
│  │   Manager    │   │      TTL: 60 seconds
│  └──────────────┘   │
│  ┌──────────────┐   │
│  │   Selector   │   │◄──── Algorithm Engine
│  │   Engine     │   │      6 Strategies
│  └──────────────┘   │
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Data Layer        │
│  ┌──────────────┐   │
│  │ PostgreSQL   │   │◄──── Persistent Storage
│  │   Primary    │   │      UTXO History
│  └──────────────┘   │      Transaction Logs
│  ┌──────────────┐   │
│  │  Bitcoin     │   │◄──── Real-time Data
│  │   Core RPC   │   │      Blockchain Sync
│  └──────────────┘   │
└─────────────────────┘
```

## API Design

### 1. **RESTful Endpoints**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/` | Service information |
| `GET` | `/utxos/:address` | Address UTXO query |
| `POST` | `/select` | Single address selection |
| `POST` | `/multi-select` | Multi-address selection |
| `POST` | `/multi-summary` | Multi-address summary |
| `GET` | `/balance/:address` | Address balance |
| `GET` | `/stats/:address` | Address statistics |
| `POST` | `/refresh` | UTXO data refresh |

### 2. **Request/Response Flow**

```
Client Request
      │
      ▼
┌─────────────┐
│ Validation  │◄──── Input validation
│   Layer     │      Parameter checking
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Business    │◄──── Algorithm selection
│   Logic     │      UTXO filtering
└─────┬───────┘      Optimization
      │
      ▼
┌─────────────┐
│ Data        │◄──── UTXO retrieval
│   Access    │      State management
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Response    │◄──── JSON formatting
│ Formatting  │      Error handling
└─────────────┘
```

## Data Model

### 1. **Core Structures**

```go
type UTXO struct {
    ID          int    `json:"ID"`
    TxID        string `json:"TxID"`
    Vout        int    `json:"Vout"`
    Address     string `json:"Address"`
    Value       int64  `json:"Value"`
    BlockHeight int    `json:"BlockHeight"`
    Spent       bool   `json:"Spent"`
}

type SelectRequest struct {
    Address  string `json:"address" binding:"required"`
    Amount   int64  `json:"amount" binding:"required"`
    Strategy string `json:"strategy"`
    FeeRate  int    `json:"fee_rate"`
}

type MultiSelectRequest struct {
    Addresses []string `json:"addresses" binding:"required"`
    Amount    int64    `json:"amount" binding:"required"`
    Strategy  string   `json:"strategy"`
    FeeRate   int      `json:"fee_rate"`
}
```

### 2. **Storage Schema (Production)**

```sql
-- UTXOs table
CREATE TABLE utxos (
    id SERIAL PRIMARY KEY,
    txid VARCHAR(64) NOT NULL,
    vout INTEGER NOT NULL,
    address VARCHAR(64) NOT NULL,
    value BIGINT NOT NULL,
    block_height INTEGER,
    spent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_address (address),
    INDEX idx_spent (spent),
    UNIQUE KEY unique_utxo (txid, vout)
);

-- Selection history (analytics)
CREATE TABLE selection_history (
    id SERIAL PRIMARY KEY,
    address VARCHAR(64),
    amount BIGINT,
    strategy VARCHAR(32),
    selected_utxos JSON,
    total_fee INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Characteristics

### 1. **Current Performance (Demo)**

| Metric | Value |
|--------|-------|
| **Response Time** | < 10ms (1,746 UTXOs) |
| **Memory Usage** | ~15MB (all algorithms) |
| **Throughput** | 1,000+ requests/second |
| **Algorithm Speed** | 347ns - 833μs |

### 2. **Algorithm Performance**

| Algorithm | Time Complexity | Space Complexity | Use Case |
|-----------|----------------|------------------|----------|
| optimize_fee_1 | O(n log n) | O(1) | Fast response |
| optimize_fee_2 | O(2^n) | O(n) | Exact matching |
| optimize_fee_3 | O(nW) | O(nW) | Optimal solution |
| optimize_fee_4 | O(1) | O(1) | Privacy |
| optimize_fee_5 | O(n log n) | O(1) | Balanced |
| optimize_fee_6 | O(gn) | O(n) | Complex optimization |

Where: n = UTXOs count, W = target amount, g = generations

## Security Architecture

### 1. **Input Validation**
- Parameter type checking
- Range validation
- SQL injection prevention
- JSON parsing limits

### 2. **Privacy Protection**
- No private key storage
- Minimal data logging
- Transaction pattern obfuscation
- Address isolation

### 3. **Error Handling**
- Graceful failure modes
- Error code standardization
- Sensitive data masking
- Recovery mechanisms

## Scalability Considerations

### 1. **Horizontal Scaling**
- Stateless API servers
- Load balancer distribution
- Redis-based session sharing
- Database read replicas

### 2. **Vertical Scaling**
- Algorithm optimization
- Memory pool management
- CPU-intensive operations
- Garbage collection tuning

### 3. **Caching Strategy**
- UTXO data caching (Redis)
- Algorithm result caching
- HTTP response caching
- Database query optimization

## Deployment Architecture

### 1. **Development Environment**
```bash
# Single instance demo
go run cmd/demo/main.go
```

### 2. **Production Environment**
```bash
# Docker-based deployment
docker-compose up -d
```

### 3. **Container Architecture**
```dockerfile
# Multi-stage build
FROM golang:1.21-alpine AS builder
FROM alpine:latest
# Optimized binary
# Health check endpoint
# Graceful shutdown
```

## Monitoring and Observability

### 1. **Metrics Collection**
- Algorithm performance metrics
- API response times
- Error rates and patterns
- Resource utilization

### 2. **Logging Strategy**
- Structured JSON logging
- Request/response tracing
- Error stack traces
- Performance profiling

### 3. **Health Checks**
- API endpoint health
- Database connectivity
- External service dependencies
- Memory and CPU usage

## Future Enhancements

### 1. **Advanced Features**
- [ ] WebSocket real-time updates
- [ ] GraphQL API support
- [ ] Machine learning optimization
- [ ] Cross-chain UTXO support

### 2. **Infrastructure Improvements**
- [ ] Kubernetes deployment
- [ ] Service mesh integration
- [ ] Distributed caching
- [ ] Advanced monitoring

### 3. **Algorithm Enhancements**
- [ ] Quantum-resistant algorithms
- [ ] Privacy-preserving techniques
- [ ] Dynamic fee optimization
- [ ] Multi-objective optimization

---

**Architecture Document Version**: 2.0  
**Last Updated**: Bitcoin Hackathon 2024  
**Team**: Helios