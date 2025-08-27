-- UTXO Indexer Database Schema

CREATE TABLE IF NOT EXISTS blocks (
    height BIGINT PRIMARY KEY,
    hash VARCHAR(64) NOT NULL UNIQUE,
    prev_hash VARCHAR(64),
    timestamp BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    txid VARCHAR(64) PRIMARY KEY,
    block_height BIGINT REFERENCES blocks(height),
    raw_tx JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS utxos (
    id SERIAL PRIMARY KEY,
    txid VARCHAR(64) NOT NULL,
    vout INTEGER NOT NULL,
    address VARCHAR(100) NOT NULL,
    value BIGINT NOT NULL,
    script_pubkey TEXT,
    block_height BIGINT REFERENCES blocks(height),
    spent BOOLEAN DEFAULT FALSE,
    spent_txid VARCHAR(64),
    spent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(txid, vout)
);

-- Indexes for performance
CREATE INDEX idx_utxos_address ON utxos(address) WHERE NOT spent;
CREATE INDEX idx_utxos_value ON utxos(value) WHERE NOT spent;
CREATE INDEX idx_utxos_block_height ON utxos(block_height);
CREATE INDEX idx_utxos_spent ON utxos(spent);
CREATE INDEX idx_transactions_block ON transactions(block_height);

-- Statistics table
CREATE TABLE IF NOT EXISTS indexer_stats (
    id SERIAL PRIMARY KEY,
    last_indexed_height BIGINT,
    total_utxos BIGINT,
    total_spent BIGINT,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);