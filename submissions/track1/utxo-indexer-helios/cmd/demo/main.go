package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	_ "github.com/helios/utxo-indexer/docs" // swagger docs
	"github.com/helios/utxo-indexer/pkg/models"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

// In-memory storage - now supports multiple addresses
type Storage struct {
	mu    sync.RWMutex
	utxos map[string][]models.UTXO // address -> UTXOs
}

var storage = &Storage{
	utxos: make(map[string][]models.UTXO),
}

// GetUTXOsForAddress implements UTXOGetter interface
func (s *Storage) GetUTXOsForAddress(address string) ([]models.UTXO, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	utxos, exists := s.utxos[address]
	if !exists {
		return []models.UTXO{}, nil
	}
	
	return utxos, nil
}

// FileUTXO represents UTXO data from the JSON file
type FileUTXO struct {
	TxID   string `json:"txid"`
	Vout   int    `json:"vout"`
	Status struct {
		Confirmed   bool   `json:"confirmed"`
		BlockHeight int64  `json:"block_height"`
		BlockHash   string `json:"block_hash"`
		BlockTime   int64  `json:"block_time"`
	} `json:"status"`
	Value int64 `json:"value"`
}

// @title UTXO Indexer-Selector API
// @version 1.0
// @description Bitcoin UTXO management service with 6 advanced selection algorithms and Multi-Address support
// @description
// @description This API provides efficient UTXO indexing and selection for Bitcoin wallets,
// @description supporting both single and multiple address management with various selection strategies.
// @description
// @description Features:
// @description - 6 Advanced UTXO selection algorithms (Knapsack DP, Branch & Bound, GA, etc.)
// @description - Multi-Address support for HD wallets
// @description - Real-time UTXO management
// @description - Fee optimization strategies
// @host localhost:8080
// @BasePath /
// @schemes http https
// @contact.name API Support
// @contact.url https://github.com/helios/utxo-indexer
// @license.name MIT
// @license.url https://opensource.org/licenses/MIT
func main() {
	// Initialize Gin
	r := gin.Default()
	
	// Health check middleware
	r.Use(func(c *gin.Context) {
		if c.Request.URL.Path == "/health" {
			c.JSON(200, gin.H{"status": "healthy"})
			c.Abort()
			return
		}
		
		// CORS headers
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		
		c.Next()
	})
	
	// Swagger endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// API routes
	r.GET("/", GetServiceInfo)
	r.GET("/utxos/:address", GetUTXOs)
	r.GET("/balance/:address", GetBalance)
	r.GET("/stats/:address", GetStats)
	r.POST("/select", SelectUTXOs)
	r.POST("/multi-select", MultiSelectUTXOs)
	r.POST("/multi-summary", GetMultiSummary)
	r.POST("/refresh", RefreshUTXOs)
	r.POST("/spend", SpendUTXOs)

	// Load test data for all demo addresses
	demoAddresses := []string{
		"bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0",
		"bcrt1qtest1small1111111111111111111111111111",
		"bcrt1qtest2mixed222222222222222222222222222",
		"bcrt1qtest3large3333333333333333333333333333",
		"bcrt1qtest4dust444444444444444444444444444",
		"bcrt1qtest5real555555555555555555555555555",
	}
	
	for _, addr := range demoAddresses {
		if err := loadUTXOsForAddress(addr); err != nil {
			log.Printf("Warning: Failed to load UTXOs for %s: %v", addr, err)
		}
	}

	// Print startup info
	fmt.Println("🚀 Starting UTXO Indexer-Selector Server...")
	fmt.Println("📊 Swagger UI: http://localhost:8080/swagger/index.html")
	fmt.Println("🌐 API Root: http://localhost:8080/")
	fmt.Printf("\n✅ Loaded UTXOs for %d addresses\n", len(storage.utxos))
	
	log.Fatal(r.Run(":8080"))
}

// Load UTXOs for an address from JSON file
func loadUTXOsForAddress(address string) error {
	// Check if already loaded
	storage.mu.RLock()
	if _, exists := storage.utxos[address]; exists {
		storage.mu.RUnlock()
		return nil
	}
	storage.mu.RUnlock()

	// Try to load from different test wallet files
	files := map[string]string{
		"bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0": "test/wallets/test_wallet.json",
		"bcrt1qtest1small1111111111111111111111111111": "test/wallets/wallet1_small_utxos.json",
		"bcrt1qtest2mixed222222222222222222222222222": "test/wallets/wallet2_mixed.json",
		"bcrt1qtest3large3333333333333333333333333333": "test/wallets/wallet3_large.json",
		"bcrt1qtest4dust444444444444444444444444444": "test/wallets/wallet4_dust.json",
		"bcrt1qtest5real555555555555555555555555555": "test/wallets/wallet5_real.json",
	}

	filename, ok := files[address]
	if !ok {
		// Try the real test file for any other address
		filename = "test/wallets/test_wallet.json"
	}

	data, err := ioutil.ReadFile(filename)
	if err != nil {
		// If specific wallet file not found, try the default
		if filename != "test/wallets/test_wallet.json" {
			data, err = ioutil.ReadFile("test/wallets/test_wallet.json")
			if err != nil {
				// Try fetching from API (fallback)
				return fetchUTXOsFromAPI(address)
			}
		} else {
			return fetchUTXOsFromAPI(address)
		}
	}

	var fileUTXOs []FileUTXO
	if err := json.Unmarshal(data, &fileUTXOs); err != nil {
		return fmt.Errorf("failed to unmarshal UTXOs: %v", err)
	}

	// Convert to our UTXO format
	utxos := make([]models.UTXO, len(fileUTXOs))
	for i, fu := range fileUTXOs {
		utxos[i] = models.UTXO{
			TxID:        fu.TxID,
			Vout:        uint32(fu.Vout),
			Address:     address,
			Value:       fu.Value,
			BlockHeight: fu.Status.BlockHeight,
			Spent:       false,
		}
	}

	// Store in cache
	storage.mu.Lock()
	storage.utxos[address] = utxos
	storage.mu.Unlock()

	return nil
}

// Fetch UTXOs from API (fallback)
func fetchUTXOsFromAPI(address string) error {
	url := fmt.Sprintf("https://mempool.regtest.midl.xyz/regtest/api/address/%s/utxo", address)
	
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("failed to fetch UTXOs: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response: %v", err)
	}

	var fileUTXOs []FileUTXO
	if err := json.Unmarshal(body, &fileUTXOs); err != nil {
		return fmt.Errorf("failed to unmarshal UTXOs: %v", err)
	}

	// Convert to our UTXO format
	utxos := make([]models.UTXO, len(fileUTXOs))
	for i, fu := range fileUTXOs {
		utxos[i] = models.UTXO{
			TxID:        fu.TxID,
			Vout:        uint32(fu.Vout),
			Address:     address,
			Value:       fu.Value,
			BlockHeight: fu.Status.BlockHeight,
			Spent:       false,
		}
	}

	// Store in cache
	storage.mu.Lock()
	storage.utxos[address] = utxos
	storage.mu.Unlock()

	return nil
}

// Calculate total value across all addresses
func calculateTotalValue() int64 {
	storage.mu.RLock()
	defer storage.mu.RUnlock()
	
	var total int64
	for _, utxos := range storage.utxos {
		for _, utxo := range utxos {
			if !utxo.Spent {
				total += utxo.Value
			}
		}
	}
	return total
}