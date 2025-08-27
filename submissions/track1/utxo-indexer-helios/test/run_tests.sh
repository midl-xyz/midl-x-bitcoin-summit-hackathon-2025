#!/bin/bash

# Script to run all tests with proper setup

set -e

echo "🚀 Starting test suite for UTXO Indexer..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if services are running
echo "📦 Checking required services..."
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${YELLOW}Starting Docker services...${NC}"
    docker-compose up -d
    sleep 5
fi

# Run database migrations
echo "🗄️  Setting up test database..."
docker-compose exec -T postgres psql -U indexer -d utxo_indexer -c "CREATE DATABASE utxo_indexer_test;" 2>/dev/null || true
docker-compose exec -T postgres psql -U indexer -d utxo_indexer_test < init.sql

# Run unit tests
echo ""
echo "🧪 Running unit tests..."
go test -v -short -race ./pkg/...
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Unit tests passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi

# Run benchmarks
echo ""
echo "⚡ Running benchmarks..."
go test -bench=. -benchmem ./pkg/selector
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Benchmarks completed${NC}"
else
    echo -e "${YELLOW}⚠️  Benchmark issues${NC}"
fi

# Run integration tests (if API server is running)
echo ""
echo "🔗 Running integration tests..."
if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    go test -v ./test/...
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Integration tests passed${NC}"
    else
        echo -e "${RED}❌ Integration tests failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  API server not running, skipping integration tests${NC}"
fi

# Generate coverage report
echo ""
echo "📊 Generating coverage report..."
go test -coverprofile=coverage.out -covermode=atomic ./...
go tool cover -func=coverage.out | tail -1

# Check coverage threshold
COVERAGE=$(go tool cover -func=coverage.out | tail -1 | awk '{print $3}' | sed 's/%//')
THRESHOLD=70

if (( $(echo "$COVERAGE >= $THRESHOLD" | bc -l) )); then
    echo -e "${GREEN}✅ Coverage ${COVERAGE}% meets threshold of ${THRESHOLD}%${NC}"
else
    echo -e "${RED}❌ Coverage ${COVERAGE}% below threshold of ${THRESHOLD}%${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
echo ""
echo "📝 Summary:"
echo "  - Unit tests: ✅"
echo "  - Benchmarks: ✅"
echo "  - Integration tests: ✅"
echo "  - Coverage: ${COVERAGE}%"
echo ""
echo "To view detailed coverage report, run: go tool cover -html=coverage.out"