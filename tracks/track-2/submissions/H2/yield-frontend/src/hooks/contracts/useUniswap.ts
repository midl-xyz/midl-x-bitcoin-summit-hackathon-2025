'use client';

import { useChainId, useWriteContract } from 'wagmi';
import { getContractAddresses } from '@/config/contracts';
import { parseUnits } from 'viem';

// Uniswap V2 Router ABI (simplified)
const ROUTER_ABI = [
  {
    name: 'addLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' }
    ]
  },
  {
    name: 'removeLiquidity',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'liquidity', type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' },
      { name: 'amountBMin', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' }
    ]
  }
] as const;

export const useUniswap = () => {
  const chainId = useChainId();
  const contracts = getContractAddresses(chainId);
  const { writeContractAsync } = useWriteContract();

  // Add liquidity to WBTC/USDC pool
  const addLiquidity = async (
    btcAmount: string,
    usdcAmount: string,
    userAddress: `0x${string}`,
    slippageTolerance: number = 0.5 // 0.5%
  ) => {
    const btcAmountWei = parseUnits(btcAmount, 8);
    const usdcAmountWei = parseUnits(usdcAmount, 6);
    
    // Calculate minimum amounts with slippage tolerance
    const btcAmountMin = btcAmountWei * BigInt(Math.floor((100 - slippageTolerance) * 100)) / 10000n;
    const usdcAmountMin = usdcAmountWei * BigInt(Math.floor((100 - slippageTolerance) * 100)) / 10000n;
    
    // Deadline: 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    return writeContractAsync({
      address: contracts.uniswap.router,
      abi: ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [
        contracts.tokens.wbtc,
        contracts.tokens.usdc,
        btcAmountWei,
        usdcAmountWei,
        btcAmountMin,
        usdcAmountMin,
        userAddress,
        deadline
      ],
    });
  };

  // Remove liquidity from WBTC/USDC pool
  const removeLiquidity = async (
    liquidityAmount: string,
    userAddress: `0x${string}`,
    slippageTolerance: number = 0.5
  ) => {
    const liquidityWei = parseUnits(liquidityAmount, 18); // LP tokens typically have 18 decimals
    
    // For demo purposes, set minimum amounts to 0 (in production, calculate based on current reserves)
    const btcAmountMin = 0n;
    const usdcAmountMin = 0n;
    
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    return writeContractAsync({
      address: contracts.uniswap.router,
      abi: ROUTER_ABI,
      functionName: 'removeLiquidity',
      args: [
        contracts.tokens.wbtc,
        contracts.tokens.usdc,
        liquidityWei,
        btcAmountMin,
        usdcAmountMin,
        userAddress,
        deadline
      ],
    });
  };

  return {
    addLiquidity,
    removeLiquidity,
    contracts,
  };
};