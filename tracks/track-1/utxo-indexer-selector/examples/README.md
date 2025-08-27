# Frontend Integration Examples

This directory contains practical examples of how to integrate the UTXO Indexer-Selector with various frontend frameworks and technologies.

## 🎯 Available Examples

### 1. **HTML/JavaScript Demo** (`wallet-demo.html`)

A complete, self-contained HTML page demonstrating vanilla JavaScript integration.

**Features:**

- Real-time stats display
- UTXO selection with multiple algorithms
- Responsive design
- Error handling
- Auto-refresh functionality

**To run:**

```bash
# Make sure UTXO Indexer-Selector is running
cd utxo-indexer-selector
cargo run --release -- --mode both &

# Open the HTML file in your browser
open examples/wallet-demo.html
```

### 2. **React Demo** (`react-demo/`)

A modern React application showing best practices for API integration.

**Features:**

- Custom React hooks for API management
- Component-based architecture
- Real-time updates
- Professional UI/UX
- TypeScript-ready structure

**To run:**

```bash
# Install dependencies
cd examples/react-demo
npm install

# Start the development server
npm start

# Visit http://localhost:3000
```

**Note:** The React app uses a proxy configuration to avoid CORS issues during development.

## 🚀 Quick Start Guide

### **Prerequisites**

1. **UTXO Indexer-Selector** running on `http://localhost:3030`
2. **Bitcoin Core** regtest environment active
3. Modern web browser with JavaScript enabled

### **Starting the Backend**

```bash
# Terminal 1: Start Bitcoin Core
cd /Users/btc/bitcoin-asia-bitcoind
docker-compose up -d

# Terminal 2: Start UTXO Indexer-Selector
cd utxo-indexer-selector
cargo run --release -- --mode both
```

### **Testing the Examples**

#### **HTML Demo:**

1. Open `wallet-demo.html` in your browser
2. Wait for stats to load (shows connection is working)
3. Enter an amount (e.g., `1.5` for 1.5 BTC)
4. Select a strategy and click "Select UTXOs"
5. View the results showing selected UTXOs

#### **React Demo:**

1. Follow the React setup instructions above
2. The app will automatically connect to the API
3. Use the same testing process as the HTML demo

## 📋 API Integration Patterns

### **Basic API Call Structure**

```javascript
const API_BASE = "http://localhost:3030";

async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "API request failed");
  }

  return result.data;
}
```

### **Common API Endpoints**

#### **Health Check**

```javascript
const health = await apiCall("/health");
console.log("Status:", health.status);
```

#### **Get Statistics**

```javascript
const stats = await apiCall("/stats");
console.log(
  `${stats.total_utxos} UTXOs worth ${stats.total_value / 100000000} BTC`
);
```

#### **Select UTXOs**

```javascript
const selection = await apiCall("/select", {
  method: "POST",
  body: JSON.stringify({
    target_amount: 100000000, // 1 BTC in satoshis
    strategy: "branch_and_bound",
    max_utxos: 10,
  }),
});

console.log(`Selected ${selection.utxos.length} UTXOs`);
```

#### **Query UTXOs**

```javascript
const utxos = await apiCall("/utxos?min_amount=1000000&limit=20");
console.log("Large UTXOs:", utxos);
```

## 🎨 UI/UX Best Practices

### **Loading States**

Always show loading indicators during API calls:

```javascript
function showLoading(show = true) {
  document.getElementById("loading").style.display = show ? "block" : "none";
}
```

### **Error Handling**

Provide clear error messages:

```javascript
function showError(message) {
  const errorDiv = document.getElementById("error");
  errorDiv.innerHTML = `<div class="error">❌ ${message}</div>`;
  errorDiv.style.display = "block";
}
```

### **Real-time Updates**

Use polling for live data:

```javascript
// Auto-refresh stats every 30 seconds
setInterval(fetchStats, 30000);
```

### **Responsive Design**

Ensure mobile compatibility:

```css
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

## 🔧 Customization Guide

### **Styling**

Both examples use CSS Grid and Flexbox for responsive layouts. Key classes:

- `.stats-grid` - Statistics display
- `.form-row` - Input forms
- `.utxo-list` - UTXO display
- `.results` - Selection results

### **Adding New Features**

#### **Custom Selection Criteria**

```javascript
async function selectWithCriteria(amount, criteria) {
  return await apiCall("/select", {
    method: "POST",
    body: JSON.stringify({
      target_amount: amount,
      strategy: criteria.strategy,
      max_utxos: criteria.maxUtxos,
      min_confirmations: criteria.minConfirmations,
    }),
  });
}
```

#### **Batch Operations**

```javascript
async function batchSelect(targets) {
  return await apiCall("/batch-select", {
    method: "POST",
    body: JSON.stringify({ targets }),
  });
}
```

## 🚨 Troubleshooting

### **Common Issues**

#### **CORS Errors**

If you see CORS errors in the browser console:

**Solution 1:** Use the React proxy (recommended for development)

```json
// In package.json
"proxy": "http://localhost:3030"
```

**Solution 2:** Configure CORS in the backend

```rust
// In your Axum server
.layer(CorsLayer::permissive())
```

#### **Connection Refused**

If the API calls fail with "connection refused":

1. Verify UTXO Indexer-Selector is running: `curl http://localhost:3030/health`
2. Check the correct port (default: 3030)
3. Ensure Bitcoin Core is running and synced

#### **API Errors**

Common API error responses:

- `"Insufficient UTXOs"` - Not enough UTXOs for the requested amount
- `"Invalid strategy"` - Unknown selection algorithm
- `"Database not ready"` - Indexer still syncing

### **Debug Mode**

Enable detailed logging in the examples:

```javascript
// Add to the top of your JavaScript
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) console.log("[DEBUG]", ...args);
}
```

## 📚 Framework-Specific Guides

### **Vue.js Integration**

```vue
<script setup>
import { ref, onMounted } from "vue";

const stats = ref(null);
const isLoading = ref(false);

async function fetchStats() {
  isLoading.value = true;
  try {
    const response = await fetch("/api/stats");
    const result = await response.json();
    stats.value = result.data;
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchStats);
</script>
```

### **Angular Integration**

```typescript
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

@Injectable()
export class UtxoService {
  constructor(private http: HttpClient) {}

  getStats() {
    return this.http.get<any>("/api/stats");
  }

  selectUtxos(amount: number, strategy: string) {
    return this.http.post<any>("/api/select", {
      target_amount: amount,
      strategy,
    });
  }
}
```

### **Svelte Integration**

```svelte
<script>
  import { onMount } from 'svelte';

  let stats = null;
  let isLoading = false;

  async function fetchStats() {
    isLoading = true;
    try {
      const response = await fetch('/api/stats');
      const result = await response.json();
      stats = result.data;
    } finally {
      isLoading = false;
    }
  }

  onMount(fetchStats);
</script>
```

## 🎯 Production Considerations

### **Environment Configuration**

```javascript
const API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://your-api-domain.com"
    : "http://localhost:3030";
```

### **Error Monitoring**

```javascript
// Integrate with Sentry or similar
import * as Sentry from "@sentry/browser";

try {
  await apiCall("/select", options);
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

### **Caching Strategy**

```javascript
// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

async function cachedApiCall(endpoint) {
  const cacheKey = endpoint;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await apiCall(endpoint);
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

## 🚀 Next Steps

1. **Explore the examples** - Start with the HTML demo for simplicity
2. **Customize the UI** - Modify styles and layouts to match your brand
3. **Add features** - Implement additional functionality using the API
4. **Deploy to production** - Follow the production guidelines above
5. **Contribute** - Submit improvements or new framework examples

The UTXO Indexer-Selector provides a powerful foundation for building Bitcoin applications with sophisticated UTXO management capabilities!
