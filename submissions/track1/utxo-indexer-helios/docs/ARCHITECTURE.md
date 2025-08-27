# System Architecture

## Overview

The UTXO Indexer-Selector is a modular, high-performance Bitcoin UTXO management system designed for scalability, reliability, and optimal transaction fee reduction.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                        │
│  (Web Apps, Mobile Apps, Wallet Software, Trading Bots)     │
└───────────────────────┬─────────────────────────────────────┘
                        │ REST API / WebSocket
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
│                    (Gin Web Framework)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Router  │  │   CORS   │  │   Auth   │  │   Rate   │  │
│  │          │  │          │  │          │  │  Limiter │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UTXO Selection Service                   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐    │  │
│  │  │ Algo 1 │ │ Algo 2 │ │ Algo 3 │ │  Algo 4-6  │    │  │
│  │  │Effective│ │ Branch │ │Knapsack│ │Random/GA/  │    │  │
│  │  │ Value  │ │& Bound │ │   DP   │ │Accumulative│    │  │
│  │  └────────┘ └────────┘ └────────┘ └────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              UTXO Indexing Service                    │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │   Index    │  │    Update    │  │   Balance    │ │  │
│  │  │  Manager   │  │   Tracker    │  │  Calculator  │ │  │
│  │  └────────────┘  └──────────────┘  └──────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │            Multi-Address Manager                      │  │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ Address  │  │   Privacy    │  │  Aggregator  │  │  │
│  │  │  Router  │  │   Mixer      │  │              │  │  │
│  │  └──────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                              │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │   PostgreSQL   │  │     Redis      │  │  File Store  │  │
│  │  (Persistent)  │  │   (Caching)    │  │  (Backup)    │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐  │
│  │  Mempool API   │  │  Alchemy API   │  │ Bitcoin Node │  │
│  │                │  │                │  │   (Future)   │  │
│  └────────────────┘  └────────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. API Gateway Layer

**Purpose**: Handle HTTP requests, authentication, and routing

**Components**:
- **Gin Router**: High-performance HTTP routing
- **CORS Middleware**: Cross-origin resource sharing
- **Authentication**: API key validation (future)
- **Rate Limiter**: Request throttling and DDoS protection

**Key Features**:
- RESTful API design
- JSON request/response
- WebSocket support (planned)
- Request validation

### 2. Service Layer

#### 2.1 UTXO Selection Service

**Purpose**: Implement and execute UTXO selection algorithms

**Algorithms**:

| Algorithm | Type | Time Complexity | Space Complexity | Use Case |
|-----------|------|-----------------|------------------|----------|
| Effective Value | Greedy | O(n log n) | O(1) | Fast selection |
| Branch & Bound | Exact | O(2^n) worst | O(n) | Exact matching |
| Knapsack DP | Dynamic | O(n*target) | O(target) | Optimal selection |
| Random Draw | Stochastic | O(n) | O(1) | Privacy |
| Accumulative | Greedy | O(n) | O(1) | Balance |
| Genetic | Metaheuristic | O(g*p*n) | O(p*n) | Large sets |

**Selection Process**:
1. Receive selection request
2. Fetch available UTXOs
3. Apply selected algorithm
4. Calculate fees
5. Return optimal selection

#### 2.2 UTXO Indexing Service

**Purpose**: Maintain real-time UTXO state

**Components**:
- **Index Manager**: In-memory UTXO indexing
- **Update Tracker**: Monitor spent/unspent status
- **Balance Calculator**: Real-time balance computation

**Features**:
- Concurrent indexing
- Atomic updates
- Cache invalidation
- Background synchronization

#### 2.3 Multi-Address Manager

**Purpose**: Handle HD wallet multi-address operations

**Components**:
- **Address Router**: Route requests to appropriate addresses
- **Privacy Mixer**: Implement CoinJoin-like features
- **Aggregator**: Combine UTXOs from multiple addresses

**Features**:
- Address derivation support
- Cross-address UTXO selection
- Privacy enhancement
- Balance aggregation

### 3. Data Layer

#### 3.1 PostgreSQL Database

**Purpose**: Persistent storage for UTXOs and transaction history

**Schema**:
```sql
-- UTXOs table
CREATE TABLE utxos (
    id SERIAL PRIMARY KEY,
    txid VARCHAR(64) NOT NULL,
    vout INTEGER NOT NULL,
    address VARCHAR(128) NOT NULL,
    value BIGINT NOT NULL,
    block_height BIGINT,
    spent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(txid, vout)
);

-- Addresses table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    address VARCHAR(128) UNIQUE NOT NULL,
    balance BIGINT DEFAULT 0,
    utxo_count INTEGER DEFAULT 0,
    last_sync TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    txid VARCHAR(64) UNIQUE NOT NULL,
    block_height BIGINT,
    timestamp TIMESTAMP,
    fee BIGINT
);
```

#### 3.2 Redis Cache

**Purpose**: High-speed caching and session management

**Key Patterns**:
- `utxo:address:{addr}` - UTXO list for address
- `balance:{addr}` - Cached balance
- `stats:algorithm:{name}` - Algorithm performance metrics
- `session:{id}` - User session data

**TTL Strategy**:
- UTXO data: 5 minutes
- Balance: 1 minute
- Statistics: 1 hour

#### 3.3 File Store

**Purpose**: Backup and recovery

**Structure**:
```
/data
  /backups
    /utxos
      utxos_20240315.json
    /addresses
      addresses_20240315.json
  /logs
    app.log
    error.log
```

### 4. External Services

#### 4.1 Mempool API

**Purpose**: Real-time blockchain data

**Endpoints Used**:
- `/api/address/{address}/utxo` - Get UTXOs
- `/api/address/{address}` - Get address info
- `/api/blocks/tip/height` - Current block height

#### 4.2 Alchemy API

**Purpose**: Alternative blockchain data source

**Features**:
- Bitcoin RPC methods
- Higher rate limits
- Better reliability

#### 4.3 Bitcoin Node (Future)

**Purpose**: Direct blockchain access

**Benefits**:
- No rate limits
- Full transaction history
- Complete privacy

## Data Flow

### UTXO Selection Flow

```
1. Client Request
   ↓
2. API Gateway validates request
   ↓
3. Service Layer fetches UTXOs
   ↓
4. Algorithm selection and execution
   ↓
5. Fee calculation
   ↓
6. Response formatting
   ↓
7. Return to client
```

### Multi-Address Flow

```
1. Multi-address request
   ↓
2. Address validation
   ↓
3. Parallel UTXO fetching
   ↓
4. Aggregation and sorting
   ↓
5. Combined selection algorithm
   ↓
6. Privacy mixing (optional)
   ↓
7. Return combined result
```

## Performance Optimization

### 1. Caching Strategy

- **L1 Cache**: In-memory Go maps for hot data
- **L2 Cache**: Redis for distributed caching
- **L3 Cache**: PostgreSQL with indexes

### 2. Concurrency

- **Goroutines**: For parallel UTXO fetching
- **Worker Pools**: For algorithm execution
- **Channel-based Communication**: For async processing

### 3. Database Optimization

- **Indexes**: On (address), (txid, vout), (block_height)
- **Partitioning**: By block height for historical data
- **Connection Pooling**: Max 100 connections

## Security Considerations

### 1. Input Validation

- Address format validation
- Amount range checks
- Algorithm parameter validation
- SQL injection prevention

### 2. Rate Limiting

- Per-IP rate limiting
- Algorithm execution limits
- Database query throttling

### 3. Authentication (Future)

- API key authentication
- JWT tokens for sessions
- Role-based access control

### 4. Data Protection

- HTTPS only in production
- Database encryption at rest
- No private key storage

## Scalability

### Horizontal Scaling

- **API Servers**: Load balanced with nginx
- **Database**: Read replicas for queries
- **Cache**: Redis cluster

### Vertical Scaling

- **Algorithm Optimization**: Parallel processing
- **Memory Management**: Efficient data structures
- **Query Optimization**: Prepared statements

## Monitoring & Observability

### Metrics

- Request rate and latency
- Algorithm performance
- Database query time
- Cache hit ratio
- Error rates

### Logging

- Structured JSON logging
- Log levels: DEBUG, INFO, WARN, ERROR
- Centralized log aggregation

### Health Checks

- `/health` endpoint
- Database connectivity
- Redis connectivity
- External API availability

## Deployment

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o utxo-indexer cmd/api/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/utxo-indexer .
EXPOSE 8080
CMD ["./utxo-indexer"]
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: utxo-indexer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: utxo-indexer
  template:
    metadata:
      labels:
        app: utxo-indexer
    spec:
      containers:
      - name: utxo-indexer
        image: utxo-indexer:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

## Future Enhancements

### Phase 1 (Q2 2024)
- WebSocket real-time updates
- API key authentication
- Advanced privacy features

### Phase 2 (Q3 2024)
- Lightning Network integration
- Machine learning fee prediction
- Mobile SDKs

### Phase 3 (Q4 2024)
- Full Bitcoin node integration
- CoinJoin implementation
- Hardware wallet support

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Language | Go 1.21+ | Core implementation |
| Web Framework | Gin | HTTP server |
| Database | PostgreSQL 15 | Persistent storage |
| Cache | Redis 7 | High-speed caching |
| Container | Docker | Deployment |
| Orchestration | Kubernetes | Scaling |
| Monitoring | Prometheus | Metrics |
| Logging | ELK Stack | Log aggregation |

## Development Guidelines

### Code Structure

```
pkg/
├── api/        # HTTP handlers
├── selector/   # Algorithm implementations
├── models/     # Data structures
├── services/   # Business logic
└── utils/      # Helper functions
```

### Testing

- Unit tests: >80% coverage
- Integration tests: API endpoints
- Benchmark tests: Algorithm performance
- Load tests: 10k requests/second target

### Contributing

1. Fork repository
2. Create feature branch
3. Write tests
4. Submit pull request
5. Code review
6. Merge to main

## License

MIT License - See LICENSE file for details