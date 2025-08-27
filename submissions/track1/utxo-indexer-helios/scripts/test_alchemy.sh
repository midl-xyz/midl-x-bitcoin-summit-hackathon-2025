#!/bin/bash

# Test script for Alchemy API integration

ALCHEMY_API_KEY="${ALCHEMY_API_KEY:-4FyQzBiVf9RfZR5K0wV9gemEQc1abNNe}"
API_URL="http://localhost:8080/api/v1/alchemy"

echo "🔍 Testing Alchemy API Integration"
echo "=================================="

# Test addresses
TEST_ADDRESSES=(
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
    "3FpYfDGJSdkMAvZvCrwPHDqdmGqUkTsJys"
)

# Test 1: Get block height
echo -e "\n📊 Test 1: Get current block height"
curl -s "${API_URL}/block/height" | jq '.'

# Test 2: Get UTXOs for addresses
for address in "${TEST_ADDRESSES[@]}"; do
    echo -e "\n💰 Test 2: Get UTXOs for ${address}"
    curl -s "${API_URL}/utxos/${address}" | jq '{address: .address, count: .count, utxos: .utxos[:2]}'
done

# Test 3: Get balance
echo -e "\n💵 Test 3: Get balance for ${TEST_ADDRESSES[0]}"
curl -s "${API_URL}/balance/${TEST_ADDRESSES[0]}" | jq '.'

# Test 4: Multi-address UTXOs
echo -e "\n🔄 Test 4: Get UTXOs for multiple addresses"
curl -s -X POST "${API_URL}/multi-utxos" \
    -H "Content-Type: application/json" \
    -d "{\"addresses\": [\"${TEST_ADDRESSES[0]}\", \"${TEST_ADDRESSES[1]}\"]}" | \
    jq '{results: .results | to_entries | map({address: .key, count: .value | length})}'

# Test 5: UTXO selection
echo -e "\n🎯 Test 5: Select UTXOs for transaction"
curl -s -X POST "${API_URL}/select" \
    -H "Content-Type: application/json" \
    -d '{
        "address": "'${TEST_ADDRESSES[0]}'",
        "amount": 100000,
        "fee_rate": 10
    }' | jq '.'

echo -e "\n✅ Alchemy API tests completed!"