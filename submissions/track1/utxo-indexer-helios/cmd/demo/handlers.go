package main

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/helios/utxo-indexer/pkg/models"
)

// GetServiceInfo godoc
// @Summary Service information
// @Description Get service information and available endpoints
// @Tags Info
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{} "Service info with endpoints and usage examples"
// @Router / [get]
func GetServiceInfo(c *gin.Context) {
	totalValue := calculateTotalValue()
	
	storage.mu.RLock()
	totalAddresses := len(storage.utxos)
	totalUTXOs := 0
	for _, utxos := range storage.utxos {
		totalUTXOs += len(utxos)
	}
	storage.mu.RUnlock()
	
	c.JSON(200, gin.H{
		"service":          "UTXO Indexer-Selector",
		"version":          "2.0",
		"total_addresses":  totalAddresses,
		"total_utxos":      totalUTXOs,
		"total_value":      totalValue,
		"default_address":  "bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0",
		"data_source":      "demo JSON file",
		"endpoints": []string{
			"GET  /                    - This page",
			"GET  /utxos/:address      - Get UTXOs for an address",
			"POST /select              - Select UTXOs for transaction",
			"POST /multi-select        - Select UTXOs from multiple addresses",
			"POST /multi-summary       - Get summary for multiple addresses",
			"GET  /balance/:address    - Get balance for an address",
			"GET  /stats/:address      - Get UTXO statistics",
			"POST /refresh             - Refresh UTXOs from live API",
			"GET  /swagger/index.html  - Swagger documentation",
		},
		"example_usage": gin.H{
			"get_utxos":      "curl http://localhost:8080/utxos/bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0",
			"select_utxos":   "curl -X POST http://localhost:8080/select -H 'Content-Type: application/json' -d '{\"address\":\"...\",\"amount\":10000,\"strategy\":\"optimize_fee_3\"}'",
			"multi_select":   "curl -X POST http://localhost:8080/multi-select -H 'Content-Type: application/json' -d '{\"addresses\":[\"addr1\",\"addr2\"],\"amount\":50000,\"strategy\":\"optimize_fee_6\"}'",
			"multi_summary":  "curl -X POST http://localhost:8080/multi-summary -H 'Content-Type: application/json' -d '{\"addresses\":[\"addr1\",\"addr2\"]}'",
		},
	})
}

// GetUTXOs godoc
// @Summary Get UTXOs for address
// @Description Get all unspent transaction outputs for a specific Bitcoin address
// @Tags UTXOs
// @Accept json
// @Produce json
// @Param address path string true "Bitcoin address"
// @Success 200 {object} map[string]interface{} "List of UTXOs"
// @Failure 400 {object} map[string]string "Bad request"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /utxos/{address} [get]
func GetUTXOs(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(400, gin.H{"error": "address is required"})
		return
	}

	// Load UTXOs if not cached
	if err := loadUTXOsForAddress(address); err != nil {
		c.JSON(500, gin.H{"error": "Failed to load UTXOs", "details": err.Error()})
		return
	}

	storage.mu.RLock()
	utxos, exists := storage.utxos[address]
	storage.mu.RUnlock()

	if !exists {
		c.JSON(200, gin.H{
			"address": address,
			"utxos":   []models.UTXO{},
			"count":   0,
		})
		return
	}

	// Filter only unspent UTXOs
	var unspentUTXOs []models.UTXO
	for _, utxo := range utxos {
		if !utxo.Spent {
			unspentUTXOs = append(unspentUTXOs, utxo)
		}
	}

	c.JSON(200, gin.H{
		"address": address,
		"utxos":   unspentUTXOs,
		"count":   len(unspentUTXOs),
	})
}

// SelectUTXOs godoc
// @Summary Select UTXOs for transaction
// @Description Select optimal UTXOs for a transaction based on amount and strategy
// @Tags Selection
// @Accept json
// @Produce json
// @Param request body models.SelectUTXORequest true "Selection parameters"
// @Success 200 {object} models.SelectUTXOResponse "Selected UTXOs"
// @Failure 400 {object} map[string]string "Bad request"
// @Failure 500 {object} map[string]string "Internal server error"
// @Router /select [post]
func SelectUTXOs(c *gin.Context) {
	var req models.SelectUTXORequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	
	// Address is now required
	if req.Address == "" {
		c.JSON(400, gin.H{"error": "address is required"})
		return
	}

	// Load UTXOs for this address if not cached
	if err := loadUTXOsForAddress(req.Address); err != nil {
		c.JSON(500, gin.H{"error": "Failed to load UTXOs", "details": err.Error()})
		return
	}

	// Select UTXOs using our simple greedy selector for now
	storage.mu.RLock()
	utxos, exists := storage.utxos[req.Address]
	storage.mu.RUnlock()
	
	if !exists {
		c.JSON(404, gin.H{"error": "No UTXOs found for address"})
		return
	}
	
	// Simple greedy selection
	var selected []models.UTXO
	var totalValue int64
	for _, utxo := range utxos {
		if utxo.Spent {
			continue
		}
		selected = append(selected, utxo)
		totalValue += utxo.Value
		if totalValue >= req.Amount {
			break
		}
	}
	
	if totalValue < req.Amount {
		c.JSON(400, gin.H{"error": "Insufficient funds"})
		return
	}

	// Calculate estimated fee (rough estimate)
	estimatedSize := 10 + 148*len(selected) + 34*2 // inputs + outputs
	estimatedFee := int64(estimatedSize) * req.FeeRate

	// totalValue is already calculated above
	change := totalValue - req.Amount - estimatedFee
	if change < 0 {
		change = 0
	}

	c.JSON(200, gin.H{
		"selected_utxos": selected,
		"total_value":    totalValue,
		"estimated_fee":  estimatedFee,
		"change":         change,
		"num_inputs":     len(selected),
		"strategy_used":  req.Strategy,
	})
}

// MultiSelectUTXOs godoc
// @Summary Multi-Address UTXO Selection
// @Description Select optimal UTXOs from multiple Bitcoin addresses for a transaction
// @Tags Multi-Address
// @Accept json
// @Produce json
// @Param request body models.MultiSelectRequest true "Multi-address selection parameters"
// @Success 200 {object} models.SelectUTXOResponse "Selected UTXOs from multiple addresses"
// @Failure 400 {object} map[string]interface{} "Bad request or insufficient funds"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /multi-select [post]
func MultiSelectUTXOs(c *gin.Context) {
	var req models.MultiSelectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Load UTXOs for all addresses
	for _, addr := range req.Addresses {
		if err := loadUTXOsForAddress(addr); err != nil {
			c.JSON(500, gin.H{"error": "Failed to load UTXOs", "address": addr, "details": err.Error()})
			return
		}
	}

	// Collect all UTXOs from all addresses
	var allUTXOs []models.UTXO
	for _, addr := range req.Addresses {
		storage.mu.RLock()
		utxos, exists := storage.utxos[addr]
		storage.mu.RUnlock()
		
		if exists {
			for _, utxo := range utxos {
				if !utxo.Spent {
					allUTXOs = append(allUTXOs, utxo)
				}
			}
		}
	}
	
	// Simple greedy selection from all addresses
	var selected []models.UTXO
	var totalValue int64
	for _, utxo := range allUTXOs {
		selected = append(selected, utxo)
		totalValue += utxo.Value
		if totalValue >= req.Amount {
			break
		}
	}
	
	if totalValue < req.Amount {
		c.JSON(400, gin.H{"error": "Insufficient funds across all addresses"})
		return
	}

	// Calculate estimated fee
	estimatedSize := 10 + 148*len(selected) + 34*2
	estimatedFee := int64(estimatedSize) * req.FeeRate

	// totalValue is already calculated above
	change := totalValue - req.Amount - estimatedFee
	if change < 0 {
		change = 0
	}

	c.JSON(200, gin.H{
		"selected_utxos": selected,
		"total_value":    totalValue,
		"estimated_fee":  estimatedFee,
		"change":         change,
		"num_inputs":     len(selected),
		"strategy_used":  req.Strategy,
	})
}

// GetMultiSummary godoc
// @Summary Multi-Address Balance Summary
// @Description Get balance and UTXO summary for multiple Bitcoin addresses
// @Tags Multi-Address
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "List of addresses"
// @Success 200 {object} map[string]interface{} "Balance summary for all addresses"
// @Failure 400 {object} map[string]interface{} "Bad request"
// @Failure 500 {object} map[string]interface{} "Internal server error"
// @Router /multi-summary [post]
func GetMultiSummary(c *gin.Context) {
	var req models.AddressListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	result := make(map[string]interface{})
	
	for _, addr := range req.Addresses {
		// Load UTXOs if not cached
		loadUTXOsForAddress(addr)
		
		storage.mu.RLock()
		utxos, exists := storage.utxos[addr]
		storage.mu.RUnlock()
		
		var balance int64
		var utxoCount int
		
		if exists {
			for _, utxo := range utxos {
				if !utxo.Spent {
					balance += utxo.Value
					utxoCount++
				}
			}
		}
		
		result[addr] = gin.H{
			"address":      addr,
			"confirmed":    balance,
			"unconfirmed":  0,
			"total_utxos":  utxoCount,
			"last_updated": time.Now().Format(time.RFC3339),
		}
	}
	
	c.JSON(200, result)
}

// GetBalance godoc
// @Summary Get balance for address
// @Description Get the total balance for a specific Bitcoin address
// @Tags Balance
// @Accept json
// @Produce json
// @Param address path string true "Bitcoin address"
// @Success 200 {object} map[string]interface{} "Balance information"
// @Router /balance/{address} [get]
func GetBalance(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(400, gin.H{"error": "address is required"})
		return
	}

	// Load UTXOs if not cached
	if err := loadUTXOsForAddress(address); err != nil {
		c.JSON(500, gin.H{"error": "Failed to load UTXOs", "details": err.Error()})
		return
	}

	storage.mu.RLock()
	utxos, exists := storage.utxos[address]
	storage.mu.RUnlock()

	if !exists {
		c.JSON(200, gin.H{
			"address": address,
			"balance": 0,
			"unit":    "satoshi",
		})
		return
	}

	var balance int64
	for _, utxo := range utxos {
		if !utxo.Spent {
			balance += utxo.Value
		}
	}

	c.JSON(200, gin.H{
		"address": address,
		"balance": balance,
		"unit":    "satoshi",
	})
}

// GetStats godoc
// @Summary Get statistics for address
// @Description Get UTXO statistics for a specific Bitcoin address
// @Tags Statistics
// @Accept json
// @Produce json
// @Param address path string true "Bitcoin address"
// @Success 200 {object} map[string]interface{} "Statistics"
// @Router /stats/{address} [get]
func GetStats(c *gin.Context) {
	address := c.Param("address")
	if address == "" {
		c.JSON(400, gin.H{"error": "address is required"})
		return
	}

	// Load UTXOs if not cached
	if err := loadUTXOsForAddress(address); err != nil {
		c.JSON(500, gin.H{"error": "Failed to load UTXOs", "details": err.Error()})
		return
	}

	storage.mu.RLock()
	utxos, exists := storage.utxos[address]
	storage.mu.RUnlock()

	if !exists {
		c.JSON(200, gin.H{
			"address":        address,
			"total_utxos":    0,
			"unspent_count":  0,
			"spent_count":    0,
			"total_value":    0,
		})
		return
	}

	var unspentCount int
	var spentCount int
	var totalValue int64

	for _, utxo := range utxos {
		if utxo.Spent {
			spentCount++
		} else {
			unspentCount++
			totalValue += utxo.Value
		}
	}

	c.JSON(200, gin.H{
		"address":        address,
		"total_utxos":    len(utxos),
		"unspent_count":  unspentCount,
		"spent_count":    spentCount,
		"total_value":    totalValue,
	})
}

// SpendUTXOs godoc
// @Summary Simulate spending
// @Description Mark UTXOs as spent (demo only)
// @Tags Demo
// @Accept json
// @Produce json
// @Param request body map[string]interface{} true "Spend request"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /spend [post]
func SpendUTXOs(c *gin.Context) {
	var req struct {
		Address string   `json:"address"`
		TxIDs   []string `json:"txids"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	storage.mu.Lock()
	defer storage.mu.Unlock()

	utxos, exists := storage.utxos[req.Address]
	if !exists {
		c.JSON(404, gin.H{"error": "Address not found"})
		return
	}

	var spentCount int
	for i := range utxos {
		for _, txid := range req.TxIDs {
			if utxos[i].TxID == txid && !utxos[i].Spent {
				utxos[i].Spent = true
				spentCount++
			}
		}
	}
	
	storage.utxos[req.Address] = utxos

	c.JSON(200, gin.H{
		"message": "UTXOs marked as spent",
		"count":   spentCount,
		"address": req.Address,
	})
}

// RefreshUTXOs godoc
// @Summary Refresh UTXOs
// @Description Refresh UTXO data for a specific address from live API
// @Tags UTXOs
// @Accept json
// @Produce json
// @Param request body map[string]string true "Address to refresh"
// @Success 200 {object} map[string]interface{} "Refresh successful"
// @Router /refresh [post]
func RefreshUTXOs(c *gin.Context) {
	var req struct {
		Address string `json:"address"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	// Try loading from file first
	if err := loadUTXOsForAddress(req.Address); err == nil {
		storage.mu.RLock()
		utxos := storage.utxos[req.Address]
		storage.mu.RUnlock()

		var totalValue int64
		for _, utxo := range utxos {
			if !utxo.Spent {
				totalValue += utxo.Value
			}
		}

		c.JSON(200, gin.H{
			"message":     "UTXOs refreshed from demo data",
			"address":     req.Address,
			"count":       len(utxos),
			"total_value": totalValue,
			"source":      "demo JSON file",
		})
		return
	}

	// If not in demo data, return empty
	c.JSON(200, gin.H{
		"message":     "No UTXOs found for this address in demo data",
		"address":     req.Address,
		"count":       0,
		"total_value": 0,
		"source":      "demo",
	})
}