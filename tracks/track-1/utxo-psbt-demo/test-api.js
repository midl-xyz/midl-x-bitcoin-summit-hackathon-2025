#!/usr/bin/env node

/**
 * Test script for the UTXO Indexer-Selector API
 *
 * This script demonstrates the wallet-specific UTXO selection and distribution analysis
 * endpoints that were added to the useUtxoIndexer hook.
 */

const API_BASE = process.env.UTXO_API_BASE || "http://localhost:3030";

async function testAPI() {
  console.log("🚀 Testing UTXO Indexer-Selector API");
  console.log(`📡 API Base URL: ${API_BASE}`);
  console.log("");

  try {
    // Test 1: Health Check
    console.log("1️⃣ Testing Health Check...");
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log("✅ Health Status:", healthData.success ? "OK" : "Failed");
    console.log("");

    // Test 2: Get Stats
    console.log("2️⃣ Testing Stats Endpoint...");
    const statsResponse = await fetch(`${API_BASE}/stats`);
    const statsData = await statsResponse.json();
    if (statsData.success) {
      console.log("✅ Stats retrieved successfully:");
      console.log(
        `   📊 Total UTXOs: ${statsData.data.total_utxos.toLocaleString()}`
      );
      console.log(
        `   💰 Total Value: ${(statsData.data.total_value / 100000000).toFixed(
          8
        )} BTC`
      );
      console.log(`   📈 Current Height: ${statsData.data.current_height}`);
      console.log(
        `   ⏳ Progress: ${statsData.data.progress_percent.toFixed(1)}%`
      );
    } else {
      console.log("❌ Failed to get stats:", statsData.error);
    }
    console.log("");

    // Test 3: Distribution Analysis
    console.log("3️⃣ Testing Distribution Analysis...");
    const distributionResponse = await fetch(
      `${API_BASE}/analysis/distribution`
    );
    const distributionData = await distributionResponse.json();
    if (distributionData.success) {
      console.log("✅ Distribution analysis retrieved successfully:");
      console.log(
        `   📊 Total UTXOs: ${distributionData.data.total_utxos.toLocaleString()}`
      );
      console.log(
        `   💰 Total Value: ${(
          distributionData.data.total_value / 100000000
        ).toFixed(8)} BTC`
      );
      console.log(
        `   📈 Average Value: ${(
          distributionData.data.average_value / 100000000
        ).toFixed(8)} BTC`
      );
      console.log(
        `   📊 Median Value: ${(
          distributionData.data.median_value / 100000000
        ).toFixed(8)} BTC`
      );
      console.log("   📋 Distribution ranges:");
      distributionData.data.ranges.forEach((range, index) => {
        console.log(
          `     ${index + 1}. ${
            range.range
          }: ${range.count.toLocaleString()} UTXOs (${range.percentage.toFixed(
            1
          )}%)`
        );
      });
    } else {
      console.log(
        "❌ Failed to get distribution analysis:",
        distributionData.error
      );
    }
    console.log("");

    // Test 4: Wallet-Specific UTXO Selection
    console.log("4️⃣ Testing Wallet-Specific UTXO Selection...");
    const walletAddress = "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
    const selectionCriteria = {
      target_amount: 500000, // 0.005 BTC in satoshis
      strategy: "largest_first",
      max_utxos: 5,
      fee_rate_sat_per_vbyte: 10.0,
      output_count: 2,
    };

    console.log(`   🔍 Selecting UTXOs for wallet: ${walletAddress}`);
    console.log(
      `   🎯 Target amount: ${(
        selectionCriteria.target_amount / 100000000
      ).toFixed(8)} BTC`
    );
    console.log(`   📋 Strategy: ${selectionCriteria.strategy}`);
    console.log(`   🔢 Max UTXOs: ${selectionCriteria.max_utxos}`);
    console.log(
      `   💸 Fee rate: ${selectionCriteria.fee_rate_sat_per_vbyte} sat/vB`
    );

    const walletSelectionResponse = await fetch(
      `${API_BASE}/wallet/${walletAddress}/select`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectionCriteria),
      }
    );

    const walletSelectionData = await walletSelectionResponse.json();
    if (walletSelectionData.success) {
      console.log("✅ Wallet UTXO selection successful:");
      console.log(
        `   📦 Selected UTXOs: ${walletSelectionData.data.utxos.length}`
      );
      console.log(
        `   💰 Total amount: ${(
          walletSelectionData.data.total_amount / 100000000
        ).toFixed(8)} BTC`
      );
      console.log(
        `   💸 Change amount: ${(
          walletSelectionData.data.change_amount / 100000000
        ).toFixed(8)} BTC`
      );
      console.log(`   🎯 Strategy used: ${walletSelectionData.data.strategy}`);
      console.log("   📋 Selected UTXOs:");
      walletSelectionData.data.utxos.forEach((utxo, index) => {
        console.log(
          `     ${index + 1}. ${utxo.outpoint}: ${(
            utxo.output.value / 100000000
          ).toFixed(8)} BTC`
        );
      });
    } else {
      console.log(
        "❌ Failed to select UTXOs for wallet:",
        walletSelectionData.error
      );
    }
    console.log("");

    // Test 5: General UTXO Selection (for comparison)
    console.log("5️⃣ Testing General UTXO Selection...");
    const generalSelectionResponse = await fetch(`${API_BASE}/select`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target_amount: selectionCriteria.target_amount,
        strategy: selectionCriteria.strategy,
        max_utxos: selectionCriteria.max_utxos,
      }),
    });

    const generalSelectionData = await generalSelectionResponse.json();
    if (generalSelectionData.success) {
      console.log("✅ General UTXO selection successful:");
      console.log(
        `   📦 Selected UTXOs: ${generalSelectionData.data.utxos.length}`
      );
      console.log(
        `   💰 Total amount: ${(
          generalSelectionData.data.total_amount / 100000000
        ).toFixed(8)} BTC`
      );
      console.log(
        `   💸 Change amount: ${(
          generalSelectionData.data.change_amount / 100000000
        ).toFixed(8)} BTC`
      );
      console.log(`   🎯 Strategy used: ${generalSelectionData.data.strategy}`);
    } else {
      console.log(
        "❌ Failed to select UTXOs generally:",
        generalSelectionData.error
      );
    }
    console.log("");

    console.log("🎉 API testing completed successfully!");
    console.log("");
    console.log("📚 API Usage Examples:");
    console.log("");
    console.log("1. Get UTXO distribution:");
    console.log("   curl http://localhost:3030/analysis/distribution");
    console.log("");
    console.log("2. Select UTXOs for specific wallet:");
    console.log(
      `   curl -X POST http://localhost:3030/wallet/${walletAddress}/select \\`
    );
    console.log('     -H "Content-Type: application/json" \\');
    console.log(`     -d '${JSON.stringify(selectionCriteria, null, 2)}'`);
    console.log("");
  } catch (error) {
    console.error("❌ Error testing API:", error.message);
    console.log("");
    console.log(
      "💡 Make sure the UTXO Indexer-Selector is running on http://localhost:3030"
    );
    console.log("   You can start it with: cargo run -- --mode both");
  }
}

// Run the tests
testAPI();
