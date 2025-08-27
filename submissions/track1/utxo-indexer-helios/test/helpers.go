package test

import (
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/helios/utxo-indexer/pkg/models"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// CreateTestDB creates a test database connection
func CreateTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("postgres", "postgres://indexer:indexer123@localhost:5432/utxo_indexer_test?sslmode=disable")
	require.NoError(t, err)

	// Clean database
	CleanDB(t, db)

	return db
}

// CleanDB cleans all data from the database
func CleanDB(t *testing.T, db *sql.DB) {
	tables := []string{"utxos", "transactions", "blocks", "indexer_stats"}
	for _, table := range tables {
		_, err := db.Exec("TRUNCATE " + table + " CASCADE")
		require.NoError(t, err)
	}
}

// CreateTestUTXOs creates test UTXOs in the database
func CreateTestUTXOs(t *testing.T, db *sql.DB) []models.UTXO {
	// Insert test block
	_, err := db.Exec(`
		INSERT INTO blocks (height, hash, prev_hash, timestamp)
		VALUES (100, 'testhash', 'prevhash', $1)`,
		time.Now().Unix())
	require.NoError(t, err)

	utxos := []models.UTXO{
		{
			TxID:        "tx001",
			Vout:        0,
			Address:     "bcrt1qtest1",
			Value:       100000,
			BlockHeight: 100,
		},
		{
			TxID:        "tx002",
			Vout:        0,
			Address:     "bcrt1qtest1",
			Value:       50000,
			BlockHeight: 100,
		},
		{
			TxID:        "tx003",
			Vout:        0,
			Address:     "bcrt1qtest1",
			Value:       25000,
			BlockHeight: 100,
			Spent:       true,
		},
		{
			TxID:        "tx004",
			Vout:        0,
			Address:     "bcrt1qtest2",
			Value:       200000,
			BlockHeight: 100,
		},
	}

	for _, utxo := range utxos {
		_, err := db.Exec(`
			INSERT INTO utxos (txid, vout, address, value, block_height, spent)
			VALUES ($1, $2, $3, $4, $5, $6)`,
			utxo.TxID, utxo.Vout, utxo.Address, utxo.Value, utxo.BlockHeight, utxo.Spent)
		require.NoError(t, err)
	}

	return utxos
}

// GenerateTestUTXOs generates a list of test UTXOs
func GenerateTestUTXOs(count int, addressPrefix string) []models.UTXO {
	utxos := make([]models.UTXO, count)
	for i := 0; i < count; i++ {
		utxos[i] = models.UTXO{
			ID:           uint64(i + 1),
			TxID:         fmt.Sprintf("tx%05d", i),
			Vout:         uint32(i % 3),
			Address:      fmt.Sprintf("%s%d", addressPrefix, i%5),
			Value:        int64((i + 1) * 1000),
			BlockHeight:  int64(100 + i),
			Spent:        false,
			CreatedAt:    time.Now(),
		}
	}
	return utxos
}

// AssertUTXOEqual asserts two UTXOs are equal
func AssertUTXOEqual(t *testing.T, expected, actual models.UTXO) {
	assert.Equal(t, expected.TxID, actual.TxID)
	assert.Equal(t, expected.Vout, actual.Vout)
	assert.Equal(t, expected.Address, actual.Address)
	assert.Equal(t, expected.Value, actual.Value)
	assert.Equal(t, expected.Spent, actual.Spent)
}

// CreateMockSelectRequest creates a mock UTXO selection request
func CreateMockSelectRequest(address string, amount int64) models.SelectUTXORequest {
	return models.SelectUTXORequest{
		Address:  address,
		Amount:   amount,
		Strategy: models.StrategyDefault,
		FeeRate:  1,
	}
}