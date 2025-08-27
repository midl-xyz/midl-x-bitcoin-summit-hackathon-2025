package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/helios/utxo-indexer/pkg/models"
)

// AlchemyClient for Bitcoin API
type AlchemyClient struct {
	BaseURL string
	APIKey  string
}

// AlchemyUTXO represents UTXO from Alchemy API
type AlchemyUTXO struct {
	TxID        string `json:"txid"`
	Vout        int    `json:"vout"`
	Value       int64  `json:"value"`
	BlockHeight int64  `json:"blockHeight"`
	Address     string `json:"address"`
}

// NewAlchemyClient creates a new Alchemy client
func NewAlchemyClient(apiKey string) *AlchemyClient {
	return &AlchemyClient{
		BaseURL: fmt.Sprintf("https://bitcoin-mainnet.g.alchemy.com/v2/%s", apiKey),
		APIKey:  apiKey,
	}
}

// GetUTXOs fetches UTXOs for an address using Alchemy Bitcoin RPC
func (c *AlchemyClient) GetUTXOs(address string) ([]models.UTXO, error) {
	// Use standard Bitcoin RPC scantxoutset method
	url := c.BaseURL
	
	// Create descriptor for the address
	descriptor := fmt.Sprintf("addr(%s)", address)
	
	reqBody := map[string]interface{}{
		"jsonrpc": "2.0",
		"method":  "scantxoutset",
		"params":  []interface{}{"start", []string{descriptor}},
		"id":      1,
	}
	
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	
	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}
	
	// Parse RPC response
	var rpcResp struct {
		Result struct {
			Success    bool    `json:"success"`
			TotalAmount float64 `json:"total_amount"`
			Unspents   []struct {
				Txid   string  `json:"txid"`
				Vout   int     `json:"vout"`
				Height int64   `json:"height"`
				Amount float64 `json:"amount"`
				ScriptPubKey string `json:"scriptPubKey"`
			} `json:"unspents"`
		} `json:"result"`
		Error *struct {
			Code    int    `json:"code"`
			Message string `json:"message"`
		} `json:"error"`
	}
	
	if err := json.Unmarshal(body, &rpcResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %v, body: %s", err, string(body))
	}
	
	if rpcResp.Error != nil {
		return nil, fmt.Errorf("RPC error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}
	
	// Convert to models.UTXO
	var utxos []models.UTXO
	for _, u := range rpcResp.Result.Unspents {
		// Convert BTC to satoshis
		value := int64(u.Amount * 100000000)
		
		utxos = append(utxos, models.UTXO{
			TxID:        u.Txid,
			Vout:        uint32(u.Vout),
			Address:     address,
			Value:       value,
			BlockHeight: u.Height,
			Spent:       false,
		})
	}
	
	return utxos, nil
}

// GetBalance fetches balance for an address
func (c *AlchemyClient) GetBalance(address string) (int64, error) {
	url := fmt.Sprintf("%s/bb/getAddressBalance", c.BaseURL)
	
	reqBody := map[string]interface{}{
		"address": address,
	}
	
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return 0, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, err
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return 0, err
	}
	
	var result struct {
		Balance string `json:"balance"`
	}
	
	if err := json.Unmarshal(body, &result); err != nil {
		return 0, err
	}
	
	var balance int64
	fmt.Sscanf(result.Balance, "%d", &balance)
	return balance, nil
}

// GetBlockHeight gets current block height
func (c *AlchemyClient) GetBlockHeight() (int64, error) {
	url := fmt.Sprintf("%s", c.BaseURL)
	
	reqBody := map[string]interface{}{
		"jsonrpc": "2.0",
		"method":  "getblockcount",
		"params":  []interface{}{},
		"id":      1,
	}
	
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return 0, err
	}
	
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return 0, err
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	
	var result struct {
		Result int64 `json:"result"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}
	
	return result.Result, nil
}

func main() {
	// Get API key from environment or use the provided one
	apiKey := os.Getenv("ALCHEMY_API_KEY")
	if apiKey == "" {
		// Use the provided API key (normally you should keep this secure)
		apiKey = "4FyQzBiVf9RfZR5K0wV9gemEQc1abNNe"
	}
	
	// Create Alchemy client
	client := NewAlchemyClient(apiKey)
	
	// Test connection
	blockHeight, err := client.GetBlockHeight()
	if err != nil {
		log.Printf("Warning: Could not get block height: %v", err)
		blockHeight = 0
	} else {
		log.Printf("Connected to Alchemy Bitcoin API. Current block height: %d", blockHeight)
	}
	
	// Initialize Gin
	r := gin.Default()
	
	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})
	
	// API endpoints
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service":      "UTXO Indexer (Alchemy Bitcoin API)",
			"network":      "Bitcoin Mainnet",
			"block_height": blockHeight,
			"endpoints": []string{
				"GET  /utxos/:address       - Get UTXOs for address",
				"GET  /balance/:address     - Get balance for address",
				"POST /multi-utxos          - Get UTXOs for multiple addresses",
				"POST /select               - Select UTXOs for transaction",
				"GET  /block/height         - Get current block height",
			},
		})
	})
	
	// Get UTXOs for an address
	r.GET("/utxos/:address", func(c *gin.Context) {
		address := c.Param("address")
		
		utxos, err := client.GetUTXOs(address)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get UTXOs: %v", err)})
			return
		}
		
		// Calculate total value
		var totalValue int64
		for _, utxo := range utxos {
			totalValue += utxo.Value
		}
		
		c.JSON(200, gin.H{
			"address":     address,
			"utxos":       utxos,
			"count":       len(utxos),
			"total_value": totalValue,
		})
	})
	
	// Get balance for an address
	r.GET("/balance/:address", func(c *gin.Context) {
		address := c.Param("address")
		
		balance, err := client.GetBalance(address)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get balance: %v", err)})
			return
		}
		
		c.JSON(200, gin.H{
			"address": address,
			"balance": balance,
			"unit":    "satoshis",
		})
	})
	
	// Get UTXOs for multiple addresses
	r.POST("/multi-utxos", func(c *gin.Context) {
		var req struct {
			Addresses []string `json:"addresses"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		
		result := make(map[string]interface{})
		var totalUTXOs int
		var totalValue int64
		
		for _, addr := range req.Addresses {
			utxos, err := client.GetUTXOs(addr)
			if err != nil {
				result[addr] = gin.H{"error": err.Error()}
				continue
			}
			
			var addrValue int64
			for _, utxo := range utxos {
				addrValue += utxo.Value
				totalValue += utxo.Value
			}
			
			result[addr] = gin.H{
				"utxos":       utxos,
				"count":       len(utxos),
				"total_value": addrValue,
			}
			totalUTXOs += len(utxos)
		}
		
		c.JSON(200, gin.H{
			"addresses":   result,
			"total_utxos": totalUTXOs,
			"total_value": totalValue,
		})
	})
	
	// Select UTXOs for transaction
	r.POST("/select", func(c *gin.Context) {
		var req struct {
			Address  string `json:"address"`
			Amount   int64  `json:"amount"`
			FeeRate  int64  `json:"fee_rate"`
			Strategy string `json:"strategy"`
		}
		
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		
		// Get UTXOs for the address
		utxos, err := client.GetUTXOs(req.Address)
		if err != nil {
			c.JSON(500, gin.H{"error": fmt.Sprintf("Failed to get UTXOs: %v", err)})
			return
		}
		
		// Simple greedy selection (you can implement more sophisticated algorithms)
		var selected []models.UTXO
		var totalValue int64
		
		for _, utxo := range utxos {
			selected = append(selected, utxo)
			totalValue += utxo.Value
			
			// Check if we have enough
			estimatedSize := 10 + 148*len(selected) + 34*2
			estimatedFee := int64(estimatedSize) * req.FeeRate
			
			if totalValue >= req.Amount+estimatedFee {
				break
			}
		}
		
		// Check if we have enough funds
		estimatedSize := 10 + 148*len(selected) + 34*2
		estimatedFee := int64(estimatedSize) * req.FeeRate
		
		if totalValue < req.Amount+estimatedFee {
			c.JSON(400, gin.H{
				"error":        "Insufficient funds",
				"required":     req.Amount + estimatedFee,
				"available":    totalValue,
				"shortage":     req.Amount + estimatedFee - totalValue,
			})
			return
		}
		
		change := totalValue - req.Amount - estimatedFee
		
		c.JSON(200, gin.H{
			"selected_utxos": selected,
			"total_value":    totalValue,
			"amount":         req.Amount,
			"estimated_fee":  estimatedFee,
			"change":         change,
			"num_inputs":     len(selected),
			"strategy_used":  req.Strategy,
		})
	})
	
	// Get current block height
	r.GET("/block/height", func(c *gin.Context) {
		height, err := client.GetBlockHeight()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		
		c.JSON(200, gin.H{
			"height":  height,
			"network": "mainnet",
		})
	})
	
	fmt.Println("🚀 Starting UTXO Indexer Server (Alchemy Bitcoin API)...")
	fmt.Println("🔗 Network: Bitcoin Mainnet")
	fmt.Printf("📦 Block height: %d\n", blockHeight)
	fmt.Println("🌐 API server: http://localhost:8082")
	fmt.Println("\n📝 Example addresses to test:")
	fmt.Println("  - bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh (P2WPKH)")
	fmt.Println("  - 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa (Genesis block)")
	fmt.Println("  - 3FpYfDGJSdkMAvZvCrwPHDqdmGqUkTsJys (P2SH)")
	
	log.Fatal(r.Run(":8082"))
}