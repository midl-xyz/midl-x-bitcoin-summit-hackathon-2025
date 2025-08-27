# dApp Demo

This repository contains a simple dApp demo that showcases the use of a vault contract for depositing and withdrawing Runes (ERC20 tokens).

## Installation

To install the necessary dependencies for this project, run the following command:

```bash
pnpm install
```

## Development

The repository is a monorepo managed by [pnpm](https://pnpm.io/) and consists of the following packages:

- `contracts`: Contains the smart contracts for the dApp.
- `dapp`: Contains the frontend application that interacts with the smart contracts.

### Compiling and deploying contracts

Please read the [contracts README](packages/contracts/README.md) for instructions on how to compile and deploy the smart contracts.

### Running the dApp

To run the dApp, navigate to the `dapp` package and start the development server:

```bash
cd apps/dapp
pnpm dev
```

### Interacting with the dApp

Once the dApp is running, you can interact with it through your web browser. The dApp allows you to deposit and withdraw Runes (ERC20 tokens) from the vault contract.

#### Pre-requisites

Ensure you have Runes in your wallet and they have been added to the MIDL ecosystem.

1. Install the [XVerse wallet](https://xverse.app/) to manage your Runes and connect to the dApp.
2. Get tBTC from the [MIDL Faucet](https://faucet.regtest.midl.xyz/).
3. Etch (mint) Runes with [MIDL Token Minter](https://runes.midl.xyz/)

##### Steps to interact with the dApp

1. Open your browser and navigate to `http://localhost:3000`.
2. Connect your wallet (e.g., XVerse).
3. Use the dApp to deposit and withdraw Runes (ERC20 tokens) from the vault.
4. You can view the transaction history on (Mempool)(http://mempool.regtest.midl.xyz) and on the [MIDL Explorer](https://blockscout.regtest.midl.xyz/).

