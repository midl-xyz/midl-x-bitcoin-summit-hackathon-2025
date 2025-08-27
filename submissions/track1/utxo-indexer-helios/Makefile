.PHONY: test test-unit test-integration test-coverage test-bench clean build run

# Variables
BINARY_NAME=utxo-indexer
COVERAGE_FILE=coverage.out

# Test commands
test: test-unit

test-unit:
	@echo "Running unit tests..."
	go test -v -short ./...

test-integration:
	@echo "Running integration tests..."
	go test -v ./...

test-coverage:
	@echo "Running tests with coverage..."
	go test -v -coverprofile=$(COVERAGE_FILE) -covermode=atomic ./...
	@echo "Coverage report:"
	go tool cover -func=$(COVERAGE_FILE)
	@echo "\nTo view HTML coverage report, run: make coverage-html"

coverage-html:
	go tool cover -html=$(COVERAGE_FILE) -o coverage.html
	@echo "Coverage report generated: coverage.html"

test-bench:
	@echo "Running benchmarks..."
	go test -bench=. -benchmem ./pkg/selector

test-race:
	@echo "Running tests with race detector..."
	go test -race -v ./...

# Build commands
build:
	@echo "Building..."
	go build -o bin/$(BINARY_NAME)-api cmd/api/main.go
	go build -o bin/$(BINARY_NAME)-indexer cmd/indexer/main.go

build-docker:
	docker build -t $(BINARY_NAME):latest .

# Run commands
run-api:
	go run cmd/api/main.go

run-indexer:
	go run cmd/indexer/main.go

run-services:
	docker-compose up -d

stop-services:
	docker-compose down

# Development commands
dev: run-services
	@echo "Starting development environment..."
	@sleep 5
	@echo "Services are ready!"
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"
	@echo "Bitcoin Core: localhost:18443"

fmt:
	go fmt ./...

lint:
	golangci-lint run

vet:
	go vet ./...

# Clean commands
clean:
	@echo "Cleaning..."
	rm -rf bin/
	rm -f $(COVERAGE_FILE) coverage.html
	go clean -testcache

clean-all: clean stop-services
	docker-compose rm -f
	docker volume rm utxo-indexer_postgres_data utxo-indexer_redis_data utxo-indexer_bitcoin_data 2>/dev/null || true

# Database commands
db-migrate:
	docker-compose exec postgres psql -U indexer -d utxo_indexer -f /docker-entrypoint-initdb.d/init.sql

db-reset:
	docker-compose exec postgres psql -U indexer -d utxo_indexer -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
	$(MAKE) db-migrate

# Help
help:
	@echo "Available commands:"
	@echo "  make test           - Run all unit tests"
	@echo "  make test-coverage  - Run tests with coverage report"
	@echo "  make test-bench     - Run benchmarks"
	@echo "  make test-race      - Run tests with race detector"
	@echo "  make build          - Build the binaries"
	@echo "  make run-api        - Run the API server"
	@echo "  make run-indexer    - Run the indexer"
	@echo "  make dev            - Start development environment"
	@echo "  make clean          - Clean build artifacts"
	@echo "  make help           - Show this help message"