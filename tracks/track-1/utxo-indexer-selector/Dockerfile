# Build stage
FROM rust:1.83-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies
RUN cargo build --release && rm -rf src

# Copy source code
COPY src ./src
COPY config.toml ./

# Build the application
RUN touch src/main.rs && cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -r -s /bin/false -m utxo-indexer

# Create directories
RUN mkdir -p /app/data && chown utxo-indexer:utxo-indexer /app/data

# Copy binary and config
COPY --from=builder /app/target/release/utxo-indexer-selector /app/
COPY --from=builder /app/config.toml /app/

# Set ownership
RUN chown -R utxo-indexer:utxo-indexer /app

WORKDIR /app

USER utxo-indexer

# Expose API port
EXPOSE 3030

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3030/health || exit 1

CMD ["./utxo-indexer-selector", "--config", "config.toml"]