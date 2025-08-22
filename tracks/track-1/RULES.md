# Track 1: UTXO Indexer-Selector

## Use Case
Bitcoin wallets and apps must manage many UTXOs, sometimes tens of thousands. Passing them all to the frontend is inefficient and exposes privacy.  

A **UTXO Indexer-Selector** enables:
- Efficient indexing of UTXOs
- Smart selection of UTXOs for spending (better fees, privacy, and reduced fragmentation)
- Aggregation for frontend apps so that only essential data is shared

This track is aimed at backend developers who want to work directly with Bitcoin data structures and optimize infrastructure-level tools.

## Prize
One half of the total hackathon prize pool + perks from Midl.

## Judging Criteria
- **Correctness & Reliability (25%)** – Does the indexer correctly track UTXOs across blocks and transactions?  
- **Performance & Efficiency (15%)** – Does it reduce overhead? Is caching effective?  
- **Developer Experience (10%)** – Is the API well-documented and simple to use?  
- **Code Quality & Portability (10%)** – Is the code clean, modular, tested, and open-source ready?  
- **Advanced Node Integration (25%)** – Using `bitcoind` directly instead of only `electrs` shows deeper knowledge and better performance.  
- **Presentation & Clarity (15%)** – Was the solution explained and demoed clearly?  

## Rules
- Submission via GitHub Pull Request to the main hackathon repo into the track-1 directory
- Deadline: **15:45 on August 27**.  
- Demo: **5 minutes + Q&A**.  
- Mentors available in the mentor area.  
- Accepted language: Go, Rust, **JavaScript**, Python

## Resources
- [MIDL Regtest Mempool.space API](https://mempool.regtest.midl.xyz/docs/api/rest) – For fetching UTXO and transaction data.
- [bitcoin node for track #1](https://github.com/midl-xyz/bitcoin-asia-bitcoind) – A ready-to-use Bitcoin node setup, specifically configured for Track #1. Use this to run a local or testnet Bitcoin node. Only for advanced usage
- Address on Bitcoin with large amount of UTXOs: `bcrt1q2sufppgjc3tdgrmwgsvgct92qrjs75nsnjyfu0`
