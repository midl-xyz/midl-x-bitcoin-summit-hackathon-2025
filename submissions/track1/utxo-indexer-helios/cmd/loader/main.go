package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

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

func main() {
	log.Println("Loading UTXOs from file...")

	// Read the UTXO file
	data, err := ioutil.ReadFile("utxos.txt")
	if err != nil {
		log.Fatal("Failed to read utxos.txt:", err)
	}

	// Parse JSON array
	var utxos []FileUTXO
	if err := json.Unmarshal(data, &utxos); err != nil {
		log.Fatal("Failed to parse JSON:", err)
	}

	log.Printf("Found %d UTXOs in file", len(utxos))

	// Database connection
	db, err := sql.Open("postgres", "postgres://indexer:indexer123@localhost:5432/utxo_indexer?sslmode=disable")
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer db.Close()

	// Redis connection
	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})

	// Clear existing data
	log.Println("Clearing existing data...")
	db.Exec("TRUNCATE utxos, blocks CASCADE")

	// Test address from hackathon
	testAddress := "bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0"

	// Track unique blocks
	blocks := make(map[int64]bool)

	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		log.Fatal("Failed to begin transaction:", err)
	}

	// Insert blocks first
	for _, utxo := range utxos {
		if !blocks[utxo.Status.BlockHeight] {
			blocks[utxo.Status.BlockHeight] = true
			_, err := tx.Exec(`
				INSERT INTO blocks (height, hash, timestamp)
				VALUES ($1, $2, $3)
				ON CONFLICT (height) DO NOTHING`,
				utxo.Status.BlockHeight, 
				utxo.Status.BlockHash,
				utxo.Status.BlockTime,
			)
			if err != nil {
				log.Printf("Error inserting block: %v", err)
			}
		}
	}

	// Insert UTXOs
	insertCount := 0
	for _, utxo := range utxos {
		_, err := tx.Exec(`
			INSERT INTO utxos (txid, vout, address, value, block_height, spent)
			VALUES ($1, $2, $3, $4, $5, false)
			ON CONFLICT (txid, vout) DO NOTHING`,
			utxo.TxID, utxo.Vout, testAddress, utxo.Value, utxo.Status.BlockHeight,
		)
		if err != nil {
			log.Printf("Error inserting UTXO: %v", err)
			continue
		}
		insertCount++
	}

	// Update stats
	tx.Exec(`
		INSERT INTO indexer_stats (id, last_indexed_height, total_utxos, last_update)
		VALUES (1, $1, $2, NOW())
		ON CONFLICT (id) DO UPDATE
		SET last_indexed_height = $1, total_utxos = $2, last_update = NOW()`,
		83200, insertCount,
	)

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Fatal("Failed to commit transaction:", err)
	}

	// Update Redis cache
	ctx := context.Background()
	rdb.Set(ctx, "latest_block", 83200, 0)
	rdb.Set(ctx, fmt.Sprintf("balance:%s", testAddress), calculateTotal(utxos), 0)

	log.Printf("✅ Successfully loaded %d UTXOs", insertCount)
	log.Printf("📊 Total blocks: %d", len(blocks))
	log.Printf("💰 Total value: %d satoshis", calculateTotal(utxos))

	// Print some statistics
	var totalUTXOs, totalValue int64
	err = db.QueryRow(`
		SELECT COUNT(*), COALESCE(SUM(value), 0)
		FROM utxos WHERE NOT spent
	`).Scan(&totalUTXOs, &totalValue)
	if err == nil {
		log.Printf("📈 Database stats: %d UTXOs, %d satoshis", totalUTXOs, totalValue)
	}
}

func calculateTotal(utxos []FileUTXO) int64 {
	var total int64
	for _, u := range utxos {
		total += u.Value
	}
	return total
}