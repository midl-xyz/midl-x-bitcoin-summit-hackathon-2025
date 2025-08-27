'use client';

import { useChainId, useWriteContract, useReadContract } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { parseUnits, formatUnits } from 'viem';

// Aave Pool ABI (simplified for demo)
const POOL_ABI = [
  {
    name: 'supply',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' },
      { name: 'referralCode', type: 'uint16' }
    ],
    outputs: []
  },
  {
    name: 'borrow',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'interestRateMode', type: 'uint256' },
      { name: 'referralCode', type: 'uint16' },
      { name: 'onBehalfOf', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'repay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'rateMode', type: 'uint256' },
      { name: 'onBehalfOf', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'asset', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'to', type: 'address' }
    ],
    outputs: []
  }
] as const;

export const useAave = () => {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const { writeContractAsync } = useWriteContract();

  // Supply collateral to Aave
  const supplyCollateral = async (
    tokenAddress: `0x${string}`,
    amount: string,
    userAddress: `0x${string}`
  ) => {
    const amountWei = parseUnits(amount, 8); // BTC has 8 decimals

    return writeContractAsync({
      address: contracts.aave.poolProxy,
      abi: POOL_ABI,
      functionName: 'supply',
      args: [tokenAddress, amountWei, userAddress, 0],
    });
  };

  // Borrow USDC from Aave
  const borrowUSDC = async (
    amount: string,
    userAddress: `0x${string}`
  ) => {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    return writeContractAsync({
      address: contracts.aave.poolProxy,
      abi: POOL_ABI,
      functionName: 'borrow',
      args: [contracts.tokens.usdc, amountWei, 2n, 0, userAddress], // 2 = variable rate
    });
  };

  // Repay USDC debt
  const repayUSDC = async (
    amount: string,
    userAddress: `0x${string}`
  ) => {
    const amountWei = parseUnits(amount, 6);

    return writeContractAsync({
      address: contracts.aave.poolProxy,
      abi: POOL_ABI,
      functionName: 'repay',
      args: [contracts.tokens.usdc, amountWei, 2n, userAddress], // 2 = variable rate
    });
  };

  // Withdraw collateral
  const withdrawCollateral = async (
    tokenAddress: `0x${string}`,
    amount: string,
    userAddress: `0x${string}`
  ) => {
    const amountWei = parseUnits(amount, 8);

    return writeContractAsync({
      address: contracts.aave.poolProxy,
      abi: POOL_ABI,
      functionName: 'withdraw',
      args: [tokenAddress, amountWei, userAddress],
    });
  };

  return {
    supplyCollateral,
    borrowUSDC,
    repayUSDC,
    withdrawCollateral,
    contracts,
  };
};