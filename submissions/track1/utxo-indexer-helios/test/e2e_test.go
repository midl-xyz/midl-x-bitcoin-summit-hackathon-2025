package test

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/helios/utxo-indexer/pkg/models"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
)

// E2ETestSuite runs end-to-end tests
type E2ETestSuite struct {
	suite.Suite
	db    *sql.DB
	redis *redis.Client
	apiURL string
}

func (suite *E2ETestSuite) SetupSuite() {
	// Connect to test database
	db, err := sql.Open("postgres", "postgres://indexer:indexer123@localhost:5432/utxo_indexer_test?sslmode=disable")
	require.NoError(suite.T(), err)
	suite.db = db

	// Connect to Redis
	suite.redis = redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
		DB:   1, // Use different DB for tests
	})

	// Set API URL (assumes API server is running)
	suite.apiURL = "http://localhost:8080/api/v1"

	// Clean database
	suite.cleanDatabase()
	
	// Insert test data
	suite.insertTestData()
}

func (suite *E2ETestSuite) TearDownSuite() {
	suite.cleanDatabase()
	suite.db.Close()
	suite.redis.Close()
}

func (suite *E2ETestSuite) cleanDatabase() {
	_, err := suite.db.Exec("TRUNCATE utxos, transactions, blocks, indexer_stats CASCADE")
	require.NoError(suite.T(), err)
	
	// Clear Redis
	ctx := context.Background()
	suite.redis.FlushDB(ctx)
}

func (suite *E2ETestSuite) insertTestData() {
	// Insert test block
	_, err := suite.db.Exec(`
		INSERT INTO blocks (height, hash, prev_hash, timestamp)
		VALUES (100, 'blockhash100', 'blockhash99', $1)`,
		time.Now().Unix())
	require.NoError(suite.T(), err)

	// Insert test UTXOs
	testUTXOs := []struct {
		txid    string
		vout    int
		address string
		value   int64
	}{
		{"tx001", 0, "bcrt1qtest1", 100000},
		{"tx002", 0, "bcrt1qtest1", 50000},
		{"tx003", 0, "bcrt1qtest1", 25000},
		{"tx004", 0, "bcrt1qtest2", 200000},
		{"tx005", 0, "bcrt1qtest2", 10000},
	}

	for _, utxo := range testUTXOs {
		_, err := suite.db.Exec(`
			INSERT INTO utxos (txid, vout, address, value, block_height, spent)
			VALUES ($1, $2, $3, $4, 100, false)`,
			utxo.txid, utxo.vout, utxo.address, utxo.value)
		require.NoError(suite.T(), err)
	}
}

func (suite *E2ETestSuite) TestHealthEndpoint() {
	resp, err := http.Get(suite.apiURL + "/health")
	require.NoError(suite.T(), err)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var health map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&health)
	require.NoError(suite.T(), err)
	assert.Equal(suite.T(), "healthy", health["status"])
}

func (suite *E2ETestSuite) TestGetUTXOs() {
	// Test getting UTXOs for an address
	resp, err := http.Get(suite.apiURL + "/utxos/bcrt1qtest1")
	require.NoError(suite.T(), err)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(suite.T(), err)

	assert.Equal(suite.T(), "bcrt1qtest1", result["address"])
	assert.Equal(suite.T(), float64(3), result["count"])

	utxos := result["utxos"].([]interface{})
	assert.Len(suite.T(), utxos, 3)
}

func (suite *E2ETestSuite) TestSelectUTXOs() {
	// Test UTXO selection
	request := models.SelectUTXORequest{
		Address:  "bcrt1qtest1",
		Amount:   120000,
		Strategy: models.StrategyOptimizeFee,
		FeeRate:  1,
	}

	body, _ := json.Marshal(request)
	resp, err := http.Post(
		suite.apiURL+"/select",
		"application/json",
		bytes.NewReader(body),
	)
	require.NoError(suite.T(), err)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var result models.SelectUTXOResponse
	err = json.NewDecoder(resp.Body).Decode(&result)
	require.NoError(suite.T(), err)

	assert.GreaterOrEqual(suite.T(), result.TotalValue, int64(120000))
	assert.Greater(suite.T(), len(result.SelectedUTXOs), 0)
	assert.Greater(suite.T(), result.EstimatedFee, int64(0))
}

func (suite *E2ETestSuite) TestGetBalance() {
	// Test balance endpoint
	resp, err := http.Get(suite.apiURL + "/balance/bcrt1qtest1")
	require.NoError(suite.T(), err)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var balance models.Balance
	err = json.NewDecoder(resp.Body).Decode(&balance)
	require.NoError(suite.T(), err)

	assert.Equal(suite.T(), "bcrt1qtest1", balance.Address)
	assert.Equal(suite.T(), int64(175000), balance.Confirmed) // 100000 + 50000 + 25000
	assert.Equal(suite.T(), 3, balance.TotalUTXOs)
}

func (suite *E2ETestSuite) TestCacheBehavior() {
	address := "bcrt1qtest2"
	
	// First request - should hit database
	resp1, err := http.Get(suite.apiURL + "/utxos/" + address)
	require.NoError(suite.T(), err)
	defer resp1.Body.Close()
	assert.Equal(suite.T(), "MISS", resp1.Header.Get("X-Cache"))

	// Second request - should hit cache
	resp2, err := http.Get(suite.apiURL + "/utxos/" + address)
	require.NoError(suite.T(), err)
	defer resp2.Body.Close()
	assert.Equal(suite.T(), "HIT", resp2.Header.Get("X-Cache"))
}

func (suite *E2ETestSuite) TestSelectUTXOsStrategies() {
	testCases := []struct {
		name     string
		strategy models.SelectStrategy
		amount   int64
		check    func(*models.SelectUTXOResponse)
	}{
		{
			name:     "Optimize Fee Strategy",
			strategy: models.StrategyOptimizeFee,
			amount:   50000,
			check: func(r *models.SelectUTXOResponse) {
				// Should use minimum number of inputs
				assert.LessOrEqual(suite.T(), r.NumInputs, 2)
			},
		},
		{
			name:     "Privacy Strategy",
			strategy: models.StrategyPrivacy,
			amount:   50000,
			check: func(r *models.SelectUTXOResponse) {
				// Should minimize change
				assert.LessOrEqual(suite.T(), r.Change, int64(100000))
			},
		},
		{
			name:     "Consolidation Strategy",
			strategy: models.StrategyConsolidation,
			amount:   50000,
			check: func(r *models.SelectUTXOResponse) {
				// Should prefer using multiple smaller UTXOs
				assert.GreaterOrEqual(suite.T(), r.NumInputs, 2)
			},
		},
	}

	for _, tc := range testCases {
		suite.T().Run(tc.name, func(t *testing.T) {
			request := models.SelectUTXORequest{
				Address:  "bcrt1qtest1",
				Amount:   tc.amount,
				Strategy: tc.strategy,
				FeeRate:  1,
			}

			body, _ := json.Marshal(request)
			resp, err := http.Post(
				suite.apiURL+"/select",
				"application/json",
				bytes.NewReader(body),
			)
			require.NoError(t, err)
			defer resp.Body.Close()

			assert.Equal(t, http.StatusOK, resp.StatusCode)

			var result models.SelectUTXOResponse
			err = json.NewDecoder(resp.Body).Decode(&result)
			require.NoError(t, err)

			tc.check(&result)
		})
	}
}

func (suite *E2ETestSuite) TestErrorHandling() {
	// Test invalid address
	resp, err := http.Get(suite.apiURL + "/utxos/invalidaddress")
	require.NoError(suite.T(), err)
	defer resp.Body.Close()
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)
	assert.Equal(suite.T(), float64(0), result["count"])

	// Test insufficient funds
	request := models.SelectUTXORequest{
		Address: "bcrt1qtest1",
		Amount:  1000000000, // Very large amount
		FeeRate: 1,
	}

	body, _ := json.Marshal(request)
	resp2, err := http.Post(
		suite.apiURL+"/select",
		"application/json",
		bytes.NewReader(body),
	)
	require.NoError(suite.T(), err)
	defer resp2.Body.Close()
	assert.Equal(suite.T(), http.StatusBadRequest, resp2.StatusCode)
}

func TestE2ESuite(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping E2E tests in short mode")
	}

	// Check if services are running
	db, err := sql.Open("postgres", "postgres://indexer:indexer123@localhost:5432/utxo_indexer_test?sslmode=disable")
	if err != nil {
		t.Skip("Database not available, skipping E2E tests")
	}
	db.Close()

	suite.Run(t, new(E2ETestSuite))
}