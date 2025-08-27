package main

import (
	"database/sql"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/helios/utxo-indexer/pkg/bitcoin"
	"github.com/helios/utxo-indexer/pkg/indexer"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

func main() {
	log.Println("Starting UTXO Indexer...")

	// Bitcoin RPC configuration
	btcHost := getEnv("BITCOIN_RPC_HOST", "localhost:18443")
	btcUser := getEnv("BITCOIN_RPC_USER", "rpcuser")
	btcPass := getEnv("BITCOIN_RPC_PASS", "rpcpassword")
	
	// Create Bitcoin client
	btcClient, err := bitcoin.NewClient(btcHost, btcUser, btcPass, true)
	if err != nil {
		log.Fatal("Failed to connect to Bitcoin node:", err)
	}
	defer btcClient.Close()

	// Test Bitcoin connection
	blockCount, err := btcClient.GetBlockCount()
	if err != nil {
		log.Fatal("Failed to get block count:", err)
	}
	log.Printf("Connected to Bitcoin node. Current height: %d", blockCount)

	// Database connection
	dbURL := getEnv("DATABASE_URL", "postgres://indexer:indexer123@localhost:5432/utxo_indexer?sslmode=disable")
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Test database connection
	if err := db.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}
	log.Println("Connected to PostgreSQL database")

	// Redis connection
	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	rdb := redis.NewClient(&redis.Options{
		Addr: redisAddr,
	})
	
	// Test Redis connection
	if err := rdb.Ping(rdb.Context()).Err(); err != nil {
		log.Fatal("Failed to connect to Redis:", err)
	}
	log.Println("Connected to Redis")

	// Create and start indexer
	idx := indexer.NewIndexer(btcClient, db, rdb)
	if err := idx.Start(); err != nil {
		log.Fatal("Failed to start indexer:", err)
	}

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	<-sigChan

	log.Println("Shutting down indexer...")
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}