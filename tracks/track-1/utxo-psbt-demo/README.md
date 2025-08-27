# UTXO PSBT Demo

A demonstration application that integrates UTXO selection with PSBT creation and MIDL signing.

## Features

- **UTXO Indexer Integration**: Connects to the UTXO Indexer-Selector API to fetch and select UTXOs
- **Multiple Selection Strategies**: Supports various UTXO selection algorithms (largest first, smallest first, branch and bound, etc.)
- **PSBT Creation**: Builds Partially Signed Bitcoin Transactions (PSBTs) from selected UTXOs
- **MIDL Signing**: Uses MIDL's signing infrastructure to sign PSBTs
- **Real-time Stats**: Displays live UTXO indexer statistics

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  UTXO Indexer   │    │   PSBT Builder   │    │  MIDL Signer    │
│   Selector      │───▶│                  │───▶│                 │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         ▼                        ▼                       ▼
   Select UTXOs            Create PSBT              Sign with MIDL
```

## Getting Started

### Prerequisites

1. **UTXO Indexer-Selector**: Make sure the UTXO Indexer-Selector is running on `http://localhost:3030`
2. **MIDL Setup**: Ensure MIDL is configured for your Bitcoin regtest network
3. **Node.js**: Version 18 or higher

### Installation

```bash
cd utxo-psbt-demo
npm install
```

### Configuration

Create a `.env.local` file:

```bash
NEXT_PUBLIC_UTXO_API_BASE=http://localhost:3030
NEXT_PUBLIC_MNEMONIC=your_mnemonic_here
```

### Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### 1. View UTXO Statistics

The top section displays real-time statistics from the UTXO Indexer:

- Total UTXOs indexed
- Total Bitcoin value
- Current blockchain height
- Synchronization progress

### 2. Select UTXOs

Configure your UTXO selection:

- **Target Amount**: Amount in BTC you want to spend
- **Selection Strategy**: Choose from multiple algorithms
- **Max UTXOs**: Limit the number of UTXOs to select

Available strategies:

- **Largest First**: Select largest UTXOs first (minimizes change)
- **Smallest First**: Select smallest UTXOs first (good for privacy)
- **Branch and Bound**: Optimal selection with minimal change
- **Oldest First**: Select oldest UTXOs first (good for coin age)
- **Newest First**: Select newest UTXOs first

### 3. Build PSBT

Once UTXOs are selected:

- Add output addresses and amounts
- Configure fee rate
- Create the PSBT

### 4. Sign with MIDL

The final step signs the PSBT using MIDL's signing infrastructure:

- Integrates with MIDL's transaction intention system
- Uses MIDL's finalization and signing hooks
- Returns a signed transaction ready for broadcast

## API Integration

### UTXO Indexer-Selector

The app integrates with the UTXO Indexer-Selector REST API:

```typescript
// Select UTXOs
const response = await fetch("/select", {
  method: "POST",
  body: JSON.stringify({
    target_amount: amountSats,
    strategy: "largest_first",
    max_utxos: 10,
  }),
});
```

### MIDL Signing

Uses MIDL's React hooks for signing:

```typescript
const { addTxIntentionAsync } = useAddTxIntention();
const { finalizeBTCTransactionAsync } = useFinalizeBTCTransaction();
const { signIntentionAsync } = useSignIntention();
```

## Components

- **`UtxoStats`**: Displays real-time UTXO indexer statistics
- **`UtxoSelector`**: Interface for selecting UTXOs with different strategies
- **`WalletUtxoSelector`**: Wallet-specific UTXO selection with advanced fee and output configuration
- **`DistributionAnalysis`**: Visual analysis of UTXO distribution across value ranges
- **`PsbtBuilder`**: Creates PSBTs from selected UTXOs and outputs
- **`PsbtSigner`**: Signs PSBTs using MIDL's infrastructure

## New Features

### Wallet-Specific UTXO Selection

The app now supports wallet-specific UTXO selection using the `/wallet/{address}/select` endpoint:

- **Target wallet address**: Specify a Bitcoin wallet address for UTXO selection
- **Advanced fee configuration**: Set fee rates per virtual byte for optimal transaction fees
- **Output count consideration**: Factor in the number of transaction outputs for fee calculation
- **Confirmation filtering**: Set minimum confirmation requirements
- **Coinbase exclusion**: Option to exclude coinbase UTXOs from selection

### UTXO Distribution Analysis

New distribution analysis feature provides insights into UTXO value distribution:

- **Visual distribution charts**: Interactive bar charts showing UTXO distribution across value ranges
- **Statistical metrics**: Average, median, and total values
- **Range-based analysis**: Breakdown of UTXOs by value ranges (dust, small, medium, large)
- **Percentage analysis**: Relative distribution of UTXOs and values

### API Integration Examples

```bash
# Get UTXO distribution
curl http://localhost:3030/analysis/distribution

# Select UTXOs for specific wallet
curl -X POST http://localhost:3030/wallet/bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh/select \
  -H "Content-Type: application/json" \
  -d '{
    "target_amount": 500000,
    "strategy": "largest_first",
    "max_utxos": 5,
    "fee_rate_sat_per_vbyte": 10.0,
    "output_count": 2
  }'
```

### Testing

Run the included test script to verify API functionality:

```bash
node test-api.js
```

## Development

### Project Structure

```
utxo-psbt-demo/
├── app/
│   ├── components/          # React components
│   ├── hooks/              # Custom hooks
│   ├── providers/          # Context providers
│   └── page.tsx           # Main page
├── public/                # Static assets
└── package.json          # Dependencies
```

### Key Dependencies

- **@midl/executor-react**: MIDL React hooks for transaction signing
- **bitcoinjs-lib**: Bitcoin library for PSBT creation
- **@tanstack/react-query**: Data fetching and caching
- **Next.js**: React framework
- **Tailwind CSS**: Styling

## Testing

The application can be tested with:

1. A running UTXO Indexer-Selector instance
2. A Bitcoin regtest network
3. MIDL configured for regtest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with the UTXO Indexer-Selector
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
