import { useReadContract, useBlockNumber } from 'wagmi';
import { formatUnits } from 'viem';
import { useEffect, useState } from 'react';
import { IL_MITIGATOR_ADDRESS, IL_MITIGATOR_ABI } from '@/contracts/impermanentLossMitigator';

export interface StrategyStatus {
  currentBtcPrice: bigint;
  totalValue: bigint;
  healthFactor: bigint;
  currentLTV: bigint;
  needsRebalance: boolean;
}

export interface StrategyMetrics {
  // Price data
  currentBtcPrice: string;
  lastRebalancePrice: string;
  initialBtcPrice: string;
  priceChangePercent: number;
  
  // Position data
  totalBtcDeposited: string;
  totalUsdtBorrowed: string;
  lpTokenBalance: string;
  
  // Health metrics
  healthFactor: number;
  currentLTV: number;
  targetLTV: number;
  maxLTV: number;
  
  // Status
  strategyActive: boolean;
  needsRebalance: boolean;
  totalValue: string;
}

export function useStrategyStatus() {
  // Get current block number
  const { data: currentBlockNumber } = useBlockNumber({ watch: true });
  
  // Use throttled block number that updates every 30 seconds
  const [blockNumber, setBlockNumber] = useState<bigint | undefined>(undefined);
  
  useEffect(() => {
    if (!currentBlockNumber) return;
    
    // Update immediately on first load
    if (!blockNumber) {
      setBlockNumber(currentBlockNumber);
    }
    
    // Then update every 30 seconds
    const interval = setInterval(() => {
      setBlockNumber(currentBlockNumber);
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [currentBlockNumber, blockNumber]);

  // Get strategy status
  const { data: strategyStatus, isLoading: statusLoading, refetch: refetchStatus } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'getStrategyStatus',
    blockNumber,
  });

  // Get price data
  const { data: currentPrice } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'getCurrentBtcPrice',
    blockNumber,
  });

  const { data: lastRebalancePrice } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'lastRebalancePrice',
    blockNumber,
  });

  const { data: initialPrice } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'initialBtcPrice',
    blockNumber,
  });

  // Get position data
  const { data: btcDeposited } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'totalBtcDeposited',
    blockNumber,
  });

  const { data: usdtBorrowed } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'totalUsdtBorrowed',
    blockNumber,
  });

  const { data: lpBalance } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'lpTokenBalance',
    blockNumber,
  });

  // Get configuration
  const { data: targetLTV } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'TARGET_LTV',
    blockNumber,
  });

  const { data: maxLTV } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'MAX_LTV',
    blockNumber,
  });

  const { data: rebalanceThreshold } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'REBALANCE_THRESHOLD',
    blockNumber,
  });

  const { data: isActive } = useReadContract({
    address: IL_MITIGATOR_ADDRESS,
    abi: IL_MITIGATOR_ABI,
    functionName: 'strategyActive',
    blockNumber,
  });

  // Process the data
  // getStrategyStatus returns: [currentBtcPrice, totalValue, healthFactor, currentLTV, needsRebalance]
  const statusArray = strategyStatus as any;
  
  const metrics: StrategyMetrics | null = strategyStatus ? {
    // Price data - using 18 decimals for prices stored in contract
    currentBtcPrice: formatUnits(statusArray?.[0] || 0n, 18),
    lastRebalancePrice: formatUnits(lastRebalancePrice as bigint || 0n, 18),
    initialBtcPrice: formatUnits(initialPrice as bigint || 0n, 18),
    priceChangePercent: lastRebalancePrice && statusArray?.[0] ? 
      ((Number(statusArray[0]) - Number(lastRebalancePrice)) / Number(lastRebalancePrice)) * 100 : 0,
    
    // Position data
    totalBtcDeposited: formatUnits(btcDeposited as bigint || 0n, 18),
    totalUsdtBorrowed: formatUnits(usdtBorrowed as bigint || 0n, 6),
    lpTokenBalance: formatUnits(lpBalance as bigint || 0n, 18),
    
    // Health metrics
    // Health factor might be max uint256 when there's no debt
    healthFactor: statusArray?.[2] ? 
      (Number(statusArray[2]) > 1e50 ? 999 : Number(formatUnits(statusArray[2], 18))) : 0,
    currentLTV: statusArray?.[3] ? Number(statusArray[3]) : 0, // LTV is already in percentage format (e.g., 65 for 65%)
    targetLTV: targetLTV ? Number(targetLTV) / 1e16 : 65, // Convert from 65e16 to 65
    maxLTV: maxLTV ? Number(maxLTV) / 1e16 : 75, // Convert from 75e16 to 75
    
    // Status - fix type issues
    strategyActive: Boolean(isActive),
    needsRebalance: statusArray?.[4] || false,
    totalValue: formatUnits(statusArray?.[1] || 0n, 18),
  } : null;

  return {
    metrics,
    isLoading: statusLoading,
    refetch: refetchStatus,
    rebalanceThreshold: rebalanceThreshold ? Number(rebalanceThreshold) / 1e16 : 5, // Convert from 8e16 to 8
  };
}