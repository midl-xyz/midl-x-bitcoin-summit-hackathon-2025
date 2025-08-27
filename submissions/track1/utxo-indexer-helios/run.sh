#!/bin/bash

# Simple startup script for UTXO Indexer

echo "🚀 Starting UTXO Indexer Demo..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "1️⃣ Starting database and cache..."
docker-compose up -d postgres redis
sleep 3

echo ""
echo "2️⃣ Loading UTXO data from file..."
go run cmd/loader/main.go

echo ""
echo "3️⃣ Starting API server..."
echo "📍 API will be available at: http://localhost:8080"
echo "📍 Test address: bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0"
echo ""
go run cmd/simple-api/main.go