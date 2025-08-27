# dApp Demo Vault Contract

This is a simple vault contract that allows users to deposit and withdraw ERC20 tokens. It uses OpenZeppelin's SafeERC20 library for safe token transfers.

## Features
- Deposit ERC20 tokens into the vault.
- Withdraw ERC20 tokens from the vault. 
- Tracks user balances for each token.

The contract is located in `./contracts/Vault.sol`.


## Installation

To install the necessary dependencies for this project, run the following command:

```
pnpm install
```

## Environment Setup

Ensure you have set the hardhat environment correctly. You should define `MNEMONIC` as a hardhat variable by running the following command:

```bash
npx hardhat vars set MNEMONIC # This command will prompt you to enter your mnemonic phrase.
```

You can read more about hardhat variables in the [hardhat documentation](https://v2.hardhat.org/hardhat-runner/docs/guides/configuration-variables).

## Deployment

First, delete the `deployments` directory if it exists to ensure a clean deployment.

```bash
rm -rf ./deployments
```

The deployment script is located in `./deploy/00_Vault.ts`.
To deploy the Vault contract run the following command: 

```
pnpm hardhat deploy --network regtest
```

After the deployment, you will find the deployed contract address in the console output or in the `deployments` directory.


## Source code verification

To verify the contract on Etherscan or similar services, you can use the following command:

```bash
pnpm hardhat verify --network regtest <contract_address>
```