package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/helios/utxo-indexer/pkg/api"
	"github.com/helios/utxo-indexer/pkg/selector"
	"github.com/helios/utxo-indexer/pkg/services"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

func main() {
	// Database connection
	dbURL := getEnv("DATABASE_URL", "postgres://indexer:indexer123@localhost:5432/utxo_indexer?sslmode=disable")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Redis connection
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	// Create selector
	sel := selector.NewSelector()

	// Create Alchemy service (optional)
	var alchemySvc *services.AlchemyService
	if alchemyAPIKey := os.Getenv("ALCHEMY_API_KEY"); alchemyAPIKey != "" {
		alchemySvc = services.NewAlchemyService(alchemyAPIKey)
		log.Println("Alchemy service enabled")
	} else {
		log.Println("Alchemy service disabled (no API key)")
	}

	// Create API handler
	handler := api.NewHandler(db, rdb, sel)

	// Setup Gin router
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// API routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", handler.Health)
		v1.GET("/utxos/:address", handler.GetUTXOs)
		v1.POST("/select", handler.SelectUTXOs)
		v1.GET("/balance/:address", handler.GetBalance)
		v1.GET("/stats", handler.GetStats)
		
		// WebSocket for real-time updates
		v1.GET("/ws", handler.WebSocket)
	}

	// Alchemy API routes (if enabled)
	if alchemySvc != nil {
		alchemy := r.Group("/api/v1/alchemy")
		{
			alchemy.GET("/utxos/:address", func(c *gin.Context) {
				address := c.Param("address")
				utxos, err := alchemySvc.GetUTXOs(address)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, gin.H{
					"address": address,
					"utxos":   utxos,
					"count":   len(utxos),
				})
			})
			
			alchemy.GET("/balance/:address", func(c *gin.Context) {
				address := c.Param("address")
				balance, err := alchemySvc.GetBalance(address)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, gin.H{
					"address": address,
					"balance": balance,
				})
			})
			
			alchemy.GET("/block/height", func(c *gin.Context) {
				height, err := alchemySvc.GetBlockHeight()
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				c.JSON(200, gin.H{"height": height})
			})
			
			alchemy.POST("/select", func(c *gin.Context) {
				var req struct {
					Address string `json:"address"`
					Amount  int64  `json:"amount"`
					FeeRate int64  `json:"fee_rate"`
				}
				
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}
				
				selection, err := alchemySvc.SelectUTXOs(req.Address, req.Amount, req.FeeRate)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				
				c.JSON(200, selection)
			})
			
			alchemy.POST("/multi-utxos", func(c *gin.Context) {
				var req struct {
					Addresses []string `json:"addresses"`
				}
				
				if err := c.ShouldBindJSON(&req); err != nil {
					c.JSON(400, gin.H{"error": err.Error()})
					return
				}
				
				results, err := alchemySvc.GetMultiAddressUTXOs(req.Addresses)
				if err != nil {
					c.JSON(500, gin.H{"error": err.Error()})
					return
				}
				
				c.JSON(200, gin.H{"results": results})
			})
		}
	}

	// Serve API documentation
	r.Static("/docs", "./docs")

	port := getEnv("PORT", "8080")
	log.Printf("API server starting on port %s", port)
	
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
	}

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("Server failed to start:", err)
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}