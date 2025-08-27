#!/bin/bash

# UTXO Indexer-Selector Demo Script
# This script demonstrates the key features of the UTXO Indexer-Selector

echo "🎉 UTXO Indexer-Selector Demo for Bitcoin Asia 🎉"
echo "=================================================="
echo

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3030"

echo -e "${BLUE}1. Health Check${NC}"
echo "Testing API health..."
curl -s $BASE_URL/health | jq '.data'
echo

echo -e "${BLUE}2. Index Statistics${NC}"
echo "Current UTXO index stats..."
curl -s $BASE_URL/stats | jq '.data'
echo

echo -e "${BLUE}3. Sample UTXOs${NC}"
echo "Showing 3 sample UTXOs from the database..."
curl -s "$BASE_URL/utxos?limit=3" | jq '.data[] | {outpoint: .outpoint, value: .output.value, confirmations}'
echo

echo -e "${BLUE}4. UTXO Selection Algorithms${NC}"
echo

echo -e "${YELLOW}4a. Largest-First Selection (2.5 BTC target)${NC}"
curl -s -X POST $BASE_URL/select -H "Content-Type: application/json" -d '{
  "target_amount": 250000000,
  "strategy": "largest_first",
  "max_utxos": 5
}' | jq '.data | {selected_utxos: (.utxos | length), total_sats: .total_amount, change_sats: .change_amount, strategy}'
echo

echo -e "${YELLOW}4b. Smallest-First Selection (1 BTC target)${NC}"
curl -s -X POST $BASE_URL/select -H "Content-Type: application/json" -d '{
  "target_amount": 100000000,
  "strategy": "smallest_first",
  "max_utxos": 10
}' | jq '.data | {selected_utxos: (.utxos | length), total_sats: .total_amount, change_sats: .change_amount, strategy}'
echo

echo -e "${YELLOW}4c. Branch-and-Bound Selection (5 BTC target)${NC}"
curl -s -X POST $BASE_URL/select -H "Content-Type: application/json" -d '{
  "target_amount": 500000000,
  "strategy": "branch_and_bound",
  "max_utxos": 5
}' | jq '.data | {selected_utxos: (.utxos | length), total_sats: .total_amount, change_sats: .change_amount, strategy}'
echo

echo -e "${BLUE}5. UTXO Distribution Analysis${NC}"
echo "Analyzing UTXO distribution across value ranges..."
curl -s "$BASE_URL/analysis/distribution" | jq '.data | {total_utxos, total_value, ranges: (.ranges | map(select(.count > 0)) | map({range: "\(.min_amount)-\(.max_amount)", count, percentage: (.percentage | floor)}))}'
echo

echo -e "${BLUE}6. Filtered UTXO Queries${NC}"
echo "Finding large UTXOs (≥50 BTC)..."
large_utxos=$(curl -s "$BASE_URL/utxos?min_amount=5000000000&limit=5" | jq '.data | length')
echo "Found $large_utxos UTXOs with value ≥ 50 BTC"
echo

echo -e "${GREEN}✅ Demo Complete!${NC}"
echo
echo "🚀 Key Features Demonstrated:"
echo "  • Real-time UTXO indexing and monitoring"
echo "  • Multiple selection algorithms (largest-first, smallest-first, branch-and-bound)"
echo "  • Efficient database storage and retrieval"
echo "  • RESTful API with comprehensive endpoints"
echo "  • UTXO filtering and distribution analysis"
echo "  • Batch selection capabilities"
echo
echo "💡 The UTXO Indexer-Selector is ready for Bitcoin Asia!"
echo "   - Indexed $(curl -s $BASE_URL/stats | jq -r '.data.total_utxos') UTXOs"
echo "   - Total value: $(curl -s $BASE_URL/stats | jq -r '.data.total_value / 100000000') BTC"
echo "   - Sync progress: $(curl -s $BASE_URL/stats | jq -r '.data.progress_percent')%"