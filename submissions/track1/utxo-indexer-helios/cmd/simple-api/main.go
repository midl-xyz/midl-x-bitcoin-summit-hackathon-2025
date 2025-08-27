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
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

func main() {
	log.Println("Starting UTXO API Server (Simplified Version)...")

	// Database connection
	dbURL := getEnv("DATABASE_URL", "postgres://indexer:indexer123@localhost:5432/utxo_indexer?sslmode=disable")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatal("Database ping failed:", err)
	}
	log.Println("✅ Connected to PostgreSQL")

	// Redis connection
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})

	// Test Redis connection
	if err := rdb.Ping(rdb.Context()).Err(); err != nil {
		log.Printf("⚠️  Redis not available, continuing without cache: %v", err)
	} else {
		log.Println("✅ Connected to Redis")
	}

	// Create selector
	sel := selector.NewSelector()

	// Create API handler
	handler := api.NewHandler(db, rdb, sel)

	// Setup Gin router
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())

	// Main page
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"service": "UTXO Indexer-Selector",
			"version": "1.0.0",
			"status":  "running",
			"endpoints": []string{
				"GET /api/v1/utxos/{address}",
				"POST /api/v1/select",
				"GET /api/v1/balance/{address}",
				"GET /api/v1/stats",
				"GET /api/v1/health",
			},
			"test_address": "bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0",
		})
	})

	// API routes
	v1 := r.Group("/api/v1")
	{
		v1.GET("/health", handler.Health)
		v1.GET("/utxos/:address", handler.GetUTXOs)
		v1.POST("/select", handler.SelectUTXOs)
		v1.GET("/balance/:address", handler.GetBalance)
		v1.GET("/stats", handler.GetStats)
		v1.GET("/ws", handler.WebSocket)
	}

	// Quick stats endpoint
	r.GET("/stats", func(c *gin.Context) {
		var stats struct {
			TotalUTXOs int64 `json:"total_utxos"`
			TotalValue int64 `json:"total_value"`
			SpentCount int64 `json:"spent_count"`
		}
		
		db.QueryRow(`
			SELECT 
				COUNT(*) FILTER (WHERE NOT spent),
				COALESCE(SUM(value) FILTER (WHERE NOT spent), 0),
				COUNT(*) FILTER (WHERE spent)
			FROM utxos
		`).Scan(&stats.TotalUTXOs, &stats.TotalValue, &stats.SpentCount)

		c.JSON(200, stats)
	})

	port := getEnv("PORT", "8080")
	log.Printf("🚀 API server starting on port %s", port)
	log.Printf("📍 Test with: http://localhost:%s", port)
	log.Printf("📍 API docs: http://localhost:%s/api/v1/health", port)
	
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