# Frontend Integration Guide

## 🌐 Using UTXO Indexer-Selector in Frontend Applications

The UTXO Indexer-Selector provides a comprehensive REST API that can be easily integrated into any frontend framework. Here's how to use it in various scenarios.

## 🚀 Quick Start Examples

### **JavaScript/TypeScript (Vanilla)**

```javascript
// Base API configuration
const API_BASE = "http://localhost:3030";

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}

// Get system health
async function getHealth() {
  const result = await apiCall("/health");
  return result.data;
}

// Get UTXO statistics
async function getStats() {
  const result = await apiCall("/stats");
  return result.data;
}

// Select UTXOs for a transaction
async function selectUtxos(
  targetAmount,
  strategy = "largest_first",
  maxUtxos = 10
) {
  const result = await apiCall("/select", {
    method: "POST",
    body: JSON.stringify({
      target_amount: targetAmount,
      strategy: strategy,
      max_utxos: maxUtxos,
    }),
  });
  return result.data;
}

// Get UTXOs with filters
async function getUtxos(filters = {}) {
  const params = new URLSearchParams();

  if (filters.minAmount) params.append("min_amount", filters.minAmount);
  if (filters.maxAmount) params.append("max_amount", filters.maxAmount);
  if (filters.minConfirmations)
    params.append("min_confirmations", filters.minConfirmations);
  if (filters.limit) params.append("limit", filters.limit);

  const result = await apiCall(`/utxos?${params}`);
  return result.data;
}

// Example usage
async function main() {
  try {
    // Check if service is healthy
    const health = await getHealth();
    console.log("Service status:", health.status);

    // Get current stats
    const stats = await getStats();
    console.log(
      `Indexed ${stats.total_utxos} UTXOs worth ${
        stats.total_value / 100000000
      } BTC`
    );

    // Select UTXOs for 1 BTC transaction
    const selection = await selectUtxos(100000000, "branch_and_bound");
    console.log(
      `Selected ${selection.utxos.length} UTXOs, change: ${
        selection.change_amount / 100000000
      } BTC`
    );
  } catch (error) {
    console.error("API Error:", error);
  }
}
```

### **React Hook (Custom)**

```typescript
// hooks/useUtxoIndexer.ts
import { useState, useEffect, useCallback } from "react";

interface UtxoStats {
  total_utxos: number;
  total_value: number;
  current_height: number;
  progress_percent: number;
}

interface UtxoEntry {
  outpoint: string;
  output: {
    value: number;
    script_pubkey: string;
  };
  height: number;
  confirmations: number;
}

interface SelectionResult {
  utxos: UtxoEntry[];
  total_amount: number;
  change_amount: number;
  strategy: string;
}

const API_BASE = "http://localhost:3030";

export function useUtxoIndexer() {
  const [stats, setStats] = useState<UtxoStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE}/stats`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select UTXOs
  const selectUtxos = useCallback(
    async (
      targetAmount: number,
      strategy: string = "largest_first",
      maxUtxos?: number
    ): Promise<SelectionResult | null> => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/select`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_amount: targetAmount,
            strategy,
            max_utxos: maxUtxos,
          }),
        });

        const result = await response.json();

        if (result.success) {
          setError(null);
          return result.data;
        } else {
          setError(result.error);
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Selection failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get UTXOs with filters
  const getUtxos = useCallback(
    async (
      filters: {
        minAmount?: number;
        maxAmount?: number;
        minConfirmations?: number;
        limit?: number;
      } = {}
    ): Promise<UtxoEntry[]> => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(
              key.replace(/([A-Z])/g, "_$1").toLowerCase(),
              value.toString()
            );
          }
        });

        const response = await fetch(`${API_BASE}/utxos?${params}`);
        const result = await response.json();

        if (result.success) {
          setError(null);
          return result.data;
        } else {
          setError(result.error);
          return [];
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch UTXOs");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Auto-refresh stats
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    selectUtxos,
    getUtxos,
  };
}
```

### **React Component Example**

```tsx
// components/UtxoWallet.tsx
import React, { useState } from "react";
import { useUtxoIndexer } from "../hooks/useUtxoIndexer";

const UtxoWallet: React.FC = () => {
  const { stats, isLoading, error, selectUtxos, getUtxos } = useUtxoIndexer();
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [strategy, setStrategy] = useState<string>("largest_first");
  const [selection, setSelection] = useState<any>(null);

  const handleSelect = async () => {
    if (!targetAmount) return;

    const amountSats = Math.floor(parseFloat(targetAmount) * 100000000);
    const result = await selectUtxos(amountSats, strategy);
    setSelection(result);
  };

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="utxo-wallet">
      <h2>Bitcoin UTXO Wallet</h2>

      {/* Stats Display */}
      <div className="stats-panel">
        <h3>Wallet Statistics</h3>
        {stats && (
          <div className="stats-grid">
            <div className="stat">
              <label>Total UTXOs:</label>
              <span>{stats.total_utxos.toLocaleString()}</span>
            </div>
            <div className="stat">
              <label>Total Balance:</label>
              <span>{formatBTC(stats.total_value)} BTC</span>
            </div>
            <div className="stat">
              <label>Sync Progress:</label>
              <span>{stats.progress_percent.toFixed(1)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* UTXO Selection */}
      <div className="selection-panel">
        <h3>Create Transaction</h3>
        <div className="form-group">
          <label>Amount (BTC):</label>
          <input
            type="number"
            step="0.00000001"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00000000"
          />
        </div>

        <div className="form-group">
          <label>Selection Strategy:</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
          >
            <option value="largest_first">Largest First</option>
            <option value="smallest_first">Smallest First</option>
            <option value="branch_and_bound">Branch and Bound</option>
            <option value="oldest_first">Oldest First</option>
            <option value="newest_first">Newest First</option>
          </select>
        </div>

        <button onClick={handleSelect} disabled={isLoading || !targetAmount}>
          {isLoading ? "Selecting..." : "Select UTXOs"}
        </button>
      </div>

      {/* Selection Results */}
      {selection && (
        <div className="results-panel">
          <h3>Selection Results</h3>
          <div className="result-summary">
            <p>
              <strong>Selected UTXOs:</strong> {selection.utxos.length}
            </p>
            <p>
              <strong>Total Amount:</strong> {formatBTC(selection.total_amount)}{" "}
              BTC
            </p>
            <p>
              <strong>Change:</strong> {formatBTC(selection.change_amount)} BTC
            </p>
            <p>
              <strong>Strategy:</strong> {selection.strategy}
            </p>
          </div>

          <div className="utxo-list">
            <h4>Selected UTXOs:</h4>
            {selection.utxos.slice(0, 5).map((utxo: any, index: number) => (
              <div key={index} className="utxo-item">
                <span className="outpoint">
                  {utxo.outpoint.slice(0, 20)}...
                </span>
                <span className="value">
                  {formatBTC(utxo.output.value)} BTC
                </span>
                <span className="confirmations">{utxo.confirmations} conf</span>
              </div>
            ))}
            {selection.utxos.length > 5 && (
              <p>... and {selection.utxos.length - 5} more UTXOs</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UtxoWallet;
```

### **Vue.js Composition API**

```vue
<!-- components/UtxoManager.vue -->
<template>
  <div class="utxo-manager">
    <h2>UTXO Manager</h2>

    <!-- Stats -->
    <div v-if="stats" class="stats">
      <div class="stat-card">
        <h3>{{ stats.total_utxos.toLocaleString() }}</h3>
        <p>Total UTXOs</p>
      </div>
      <div class="stat-card">
        <h3>{{ (stats.total_value / 100000000).toFixed(2) }} BTC</h3>
        <p>Total Value</p>
      </div>
      <div class="stat-card">
        <h3>{{ stats.progress_percent.toFixed(1) }}%</h3>
        <p>Sync Progress</p>
      </div>
    </div>

    <!-- UTXO Selection Form -->
    <form @submit.prevent="selectUtxos" class="selection-form">
      <div class="form-row">
        <input
          v-model="targetAmount"
          type="number"
          step="0.00000001"
          placeholder="Amount in BTC"
          required
        />
        <select v-model="selectedStrategy">
          <option value="largest_first">Largest First</option>
          <option value="smallest_first">Smallest First</option>
          <option value="branch_and_bound">Branch and Bound</option>
        </select>
        <button type="submit" :disabled="loading">
          {{ loading ? "Selecting..." : "Select UTXOs" }}
        </button>
      </div>
    </form>

    <!-- Results -->
    <div v-if="selectionResult" class="results">
      <h3>Selection Result</h3>
      <p>Selected {{ selectionResult.utxos.length }} UTXOs</p>
      <p>
        Total: {{ (selectionResult.total_amount / 100000000).toFixed(8) }} BTC
      </p>
      <p>
        Change: {{ (selectionResult.change_amount / 100000000).toFixed(8) }} BTC
      </p>
    </div>

    <div v-if="error" class="error">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

const API_BASE = "http://localhost:3030";

// Reactive state
const stats = ref(null);
const targetAmount = ref("");
const selectedStrategy = ref("largest_first");
const selectionResult = ref(null);
const loading = ref(false);
const error = ref("");

// API functions
async function fetchStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    const result = await response.json();
    if (result.success) {
      stats.value = result.data;
      error.value = "";
    }
  } catch (err) {
    error.value = "Failed to fetch stats";
  }
}

async function selectUtxos() {
  if (!targetAmount.value) return;

  try {
    loading.value = true;
    const amountSats = Math.floor(parseFloat(targetAmount.value) * 100000000);

    const response = await fetch(`${API_BASE}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_amount: amountSats,
        strategy: selectedStrategy.value,
      }),
    });

    const result = await response.json();
    if (result.success) {
      selectionResult.value = result.data;
      error.value = "";
    } else {
      error.value = result.error;
    }
  } catch (err) {
    error.value = "Selection failed";
  } finally {
    loading.value = false;
  }
}

// Lifecycle
let interval: number;

onMounted(() => {
  fetchStats();
  interval = setInterval(fetchStats, 30000);
});

onUnmounted(() => {
  if (interval) clearInterval(interval);
});
</script>

<style scoped>
.stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.selection-form .form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.error {
  color: red;
  margin-top: 1rem;
}
</style>
```

## 🎨 UI/UX Integration Patterns

### **Wallet Dashboard**

```javascript
// Dashboard component showing UTXO overview
class UtxoDashboard {
  constructor(apiBase = "http://localhost:3030") {
    this.apiBase = apiBase;
    this.init();
  }

  async init() {
    await this.loadStats();
    await this.loadDistribution();
    this.startAutoRefresh();
  }

  async loadStats() {
    const stats = await this.apiCall("/stats");
    this.updateStatsDisplay(stats.data);
  }

  async loadDistribution() {
    const distribution = await this.apiCall("/analysis/distribution");
    this.renderDistributionChart(distribution.data);
  }

  updateStatsDisplay(stats) {
    document.getElementById("total-utxos").textContent =
      stats.total_utxos.toLocaleString();
    document.getElementById("total-value").textContent = `${(
      stats.total_value / 100000000
    ).toFixed(2)} BTC`;
    document.getElementById(
      "sync-progress"
    ).textContent = `${stats.progress_percent.toFixed(1)}%`;

    // Update progress bar
    const progressBar = document.getElementById("progress-bar");
    progressBar.style.width = `${stats.progress_percent}%`;
  }

  renderDistributionChart(data) {
    // Integration with Chart.js or similar
    const ctx = document.getElementById("distribution-chart").getContext("2d");
    new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.ranges.map((r) => `${r.min_amount}-${r.max_amount} sats`),
        datasets: [
          {
            data: data.ranges.map((r) => r.count),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
            ],
          },
        ],
      },
    });
  }

  async apiCall(endpoint, options = {}) {
    const response = await fetch(`${this.apiBase}${endpoint}`, options);
    return response.json();
  }
}
```

### **Transaction Builder**

```javascript
// Transaction builder with UTXO selection
class TransactionBuilder {
  constructor(apiBase = "http://localhost:3030") {
    this.apiBase = apiBase;
    this.selectedUtxos = [];
    this.outputs = [];
  }

  async buildTransaction(outputs, feeRate = 1) {
    // Calculate total output amount
    const totalOutput = outputs.reduce((sum, output) => sum + output.value, 0);
    const estimatedFee = this.estimateFee(outputs.length, feeRate);
    const targetAmount = totalOutput + estimatedFee;

    // Select optimal UTXOs
    const selection = await this.selectOptimalUtxos(targetAmount);

    if (!selection) {
      throw new Error("Insufficient funds");
    }

    // Build transaction object
    return {
      inputs: selection.utxos.map((utxo) => ({
        txid: utxo.outpoint.split(":")[0],
        vout: parseInt(utxo.outpoint.split(":")[1]),
        value: utxo.output.value,
      })),
      outputs: outputs,
      fee: selection.total_amount - totalOutput,
      change: selection.change_amount,
    };
  }

  async selectOptimalUtxos(targetAmount) {
    // Try different strategies and pick the best one
    const strategies = ["branch_and_bound", "largest_first", "smallest_first"];
    let bestSelection = null;
    let bestScore = Infinity;

    for (const strategy of strategies) {
      try {
        const selection = await this.apiCall("/select", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_amount: targetAmount,
            strategy: strategy,
          }),
        });

        if (selection.success) {
          const score = this.calculateSelectionScore(selection.data);
          if (score < bestScore) {
            bestScore = score;
            bestSelection = selection.data;
          }
        }
      } catch (error) {
        console.warn(`Strategy ${strategy} failed:`, error);
      }
    }

    return bestSelection;
  }

  calculateSelectionScore(selection) {
    // Score based on number of UTXOs (prefer fewer) and change amount (prefer less change)
    const utxoCount = selection.utxos.length;
    const changeAmount = selection.change_amount;
    return utxoCount * 1000 + changeAmount * 0.001;
  }

  estimateFee(outputCount, feeRate) {
    // Rough fee estimation (in practice, use more sophisticated calculation)
    const inputSize = 148; // bytes per input (approximate)
    const outputSize = 34; // bytes per output
    const baseSize = 10; // transaction overhead

    const estimatedInputs = 2; // Conservative estimate
    const totalSize =
      baseSize + estimatedInputs * inputSize + outputCount * outputSize;

    return totalSize * feeRate;
  }

  async apiCall(endpoint, options = {}) {
    const response = await fetch(`${this.apiBase}${endpoint}`, options);
    return response.json();
  }
}

// Usage example
const txBuilder = new TransactionBuilder();

async function createTransaction() {
  const outputs = [
    { address: "bc1q...", value: 100000000 }, // 1 BTC
    { address: "bc1q...", value: 50000000 }, // 0.5 BTC
  ];

  try {
    const tx = await txBuilder.buildTransaction(outputs);
    console.log("Transaction built:", tx);
    // Now you can sign and broadcast the transaction
  } catch (error) {
    console.error("Failed to build transaction:", error);
  }
}
```

## 🔧 Integration Best Practices

### **Error Handling**

```javascript
// Robust error handling wrapper
class UtxoApiClient {
  constructor(baseUrl = "http://localhost:3030", options = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 3;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      timeout: this.timeout,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    let lastError;

    for (let i = 0; i <= this.retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "API request failed");
        }

        return result.data;
      } catch (error) {
        lastError = error;

        if (i < this.retries) {
          // Exponential backoff
          const delay = Math.pow(2, i) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError;
  }

  // Convenience methods
  async getStats() {
    return this.request("/stats");
  }
  async getHealth() {
    return this.request("/health");
  }
  async selectUtxos(params) {
    return this.request("/select", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }
  async getUtxos(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/utxos${query ? "?" + query : ""}`);
  }
}
```

### **Real-time Updates**

```javascript
// WebSocket-like real-time updates using polling
class UtxoRealtimeClient {
  constructor(apiClient, updateInterval = 30000) {
    this.api = apiClient;
    this.interval = updateInterval;
    this.listeners = new Map();
    this.isRunning = false;
  }

  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    if (!this.isRunning) {
      this.start();
    }
  }

  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("Listener error:", error);
        }
      });
    }
  }

  async start() {
    if (this.isRunning) return;

    this.isRunning = true;
    let lastStats = null;

    while (this.isRunning) {
      try {
        const stats = await this.api.getStats();

        if (lastStats) {
          // Check for changes
          if (stats.total_utxos !== lastStats.total_utxos) {
            this.emit("utxos_changed", {
              previous: lastStats.total_utxos,
              current: stats.total_utxos,
              difference: stats.total_utxos - lastStats.total_utxos,
            });
          }

          if (stats.current_height !== lastStats.current_height) {
            this.emit("new_block", {
              height: stats.current_height,
              previous: lastStats.current_height,
            });
          }
        }

        this.emit("stats_updated", stats);
        lastStats = stats;
      } catch (error) {
        this.emit("error", error);
      }

      await new Promise((resolve) => setTimeout(resolve, this.interval));
    }
  }

  stop() {
    this.isRunning = false;
  }
}

// Usage
const apiClient = new UtxoApiClient();
const realtimeClient = new UtxoRealtimeClient(apiClient);

realtimeClient.subscribe("new_block", (data) => {
  console.log(`New block #${data.height}!`);
  // Update UI
});

realtimeClient.subscribe("utxos_changed", (data) => {
  console.log(
    `UTXOs changed: ${data.difference > 0 ? "+" : ""}${data.difference}`
  );
  // Update UTXO list
});
```

## 🎯 Common Use Cases

### **1. Wallet Balance Display**

- Real-time UTXO count and total value
- Sync progress indicator
- Transaction history integration

### **2. Transaction Creation**

- UTXO selection for optimal fees
- Multiple selection strategies
- Fee estimation and optimization

### **3. Portfolio Management**

- UTXO distribution analysis
- Privacy-focused coin selection
- Batch transaction planning

### **4. Developer Tools**

- UTXO set exploration
- Transaction debugging
- Performance monitoring

### **5. Analytics Dashboard**

- UTXO growth trends
- Selection algorithm comparison
- System performance metrics

## 🔒 Security Considerations

1. **API Endpoint Security**: Always use HTTPS in production
2. **Input Validation**: Validate all user inputs before API calls
3. **Error Handling**: Don't expose sensitive information in error messages
4. **Rate Limiting**: Implement client-side rate limiting for API calls
5. **CORS Configuration**: Ensure proper CORS settings for web applications

## 📱 Mobile Integration

The REST API works seamlessly with mobile frameworks:

- **React Native**: Use fetch API as shown in examples above
- **Flutter**: Use http package with similar patterns
- **iOS/Android**: Standard HTTP clients work perfectly

## 🚀 Production Deployment

For production use:

1. **Environment Variables**: Configure API base URL via environment
2. **Error Monitoring**: Integrate with Sentry or similar
3. **Caching**: Implement appropriate caching strategies
4. **Monitoring**: Track API performance and errors
5. **Fallbacks**: Implement graceful degradation when API is unavailable

The UTXO Indexer-Selector provides a powerful, flexible API that can be integrated into any frontend application, from simple wallets to complex Bitcoin infrastructure tools!
