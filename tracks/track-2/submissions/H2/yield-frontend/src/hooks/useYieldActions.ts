import { useCallback, useState } from 'react';
import { 
  useAddTxIntention,
  useClearTxIntentions,
  useToken as useRuneToken,
} from '@midl-xyz/midl-js-executor-react';
import { useAccount } from 'wagmi';
import { encodeFunctionData, erc20Abi, zeroAddress, type Address } from 'viem';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';

import { Asset, HeliosError } from '@/types/helios';
import { 
  HELIOS_POOL_ADDRESS, 
  HELIOS_POOL_ABI,
  BTC_GATEWAY_ADDRESS,
  BTC_GATEWAY_ABI,
  WBTC_ADDRESS,
  USDC_ADDRESS,
  USDT_ADDRESS
} from '@/contracts/mockContracts';
import { 
  IL_MITIGATOR_ADDRESS, 
  IL_MITIGATOR_ABI 
} from '@/contracts/impermanentLossMitigator';
import { weiToSatoshis } from '@midl-xyz/midl-js-executor';

// Mock assets for demo
export const MOCK_ASSETS: Asset[] = [
  {
    address: WBTC_ADDRESS,
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 18,
    isBTCAsset: true
  },
  {
    address: USDC_ADDRESS,
    symbol: 'USDC', 
    name: 'USD Coin',
    decimals: 6,
    isBTCAsset: false
  }
];

/**
 * Hook for Helios yield protocol actions
 */
export function useYieldActions() {
  const { address: userAddress } = useAccount();
  const { addTxIntention } = useAddTxIntention();
  const clearTxIntentions = useClearTxIntentions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { rune } = useRuneToken(MOCK_ASSETS[1].address);

  /**
   * Initialize Impermanent Loss Protection Strategy
   */
  const handleInitializeILProtection = useCallback(
    async (btcAmount: bigint, usdtAmount: bigint) => {
      if (!userAddress) {
        throw new HeliosError('Please connect wallet first', 'NO_WALLET');
      }

      clearTxIntentions();

      // First approve USDT spending
      addTxIntention({
        intention: {
          evmTransaction: {
            to: USDT_ADDRESS,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [IL_MITIGATOR_ADDRESS, usdtAmount]
            })
          }
          
        }
      });

      // Then initialize the IL protection strategy with BTC value
      addTxIntention({
        intention: {
          evmTransaction: {
            to: IL_MITIGATOR_ADDRESS,
            data: encodeFunctionData({
              abi: IL_MITIGATOR_ABI,
              functionName: 'initializeStrategy',
              args: [btcAmount.toString(), usdtAmount.toString()]
            }),
            value: btcAmount // Send BTC value with the transaction
          },
          deposit: {
            satoshis: weiToSatoshis(btcAmount),
            runes: [
              {
                  id: rune?.id as string,
                  amount: usdtAmount,
                  address: USDC_ADDRESS
              }
          ]
          }
        }
      });

      setIsModalOpen(true);
      
      return { success: true };
    },
    [userAddress, addTxIntention, clearTxIntentions]
  );

  const initializeILMutation = useMutation({
    mutationFn: ({ btcAmount, usdtAmount }: { btcAmount: bigint; usdtAmount: bigint }) => 
      handleInitializeILProtection(btcAmount, usdtAmount),
    onSuccess: () => {
      toast.success('IL Protection strategy initialized!');
    },
    onError: (error) => {
      console.error('IL Protection initialization failed:', error);
      toast.error(error instanceof Error ? error.message : 'Initialization failed');
    }
  });

  /**
   * Rebalance the IL protection strategy
   */
  const handleRebalance = useCallback(
    async () => {
      if (!userAddress) {
        throw new HeliosError('Please connect wallet first', 'NO_WALLET');
      }

      clearTxIntentions();

      addTxIntention({
        intention: {
          evmTransaction: {
            to: IL_MITIGATOR_ADDRESS,
            data: encodeFunctionData({
              abi: IL_MITIGATOR_ABI,
              functionName: 'rebalance',
              args: []
            })
          }
        }
      });

      setIsModalOpen(true);
      
      return { success: true };
    },
    [userAddress, addTxIntention, clearTxIntentions]
  );

  const rebalanceMutation = useMutation({
    mutationFn: handleRebalance,
    onSuccess: () => {
      toast.success('Rebalance transaction initiated!');
    },
    onError: (error) => {
      console.error('Rebalance failed:', error);
      toast.error(error instanceof Error ? error.message : 'Rebalance failed');
    }
  });

  return {
    // State
    isModalOpen,
    setIsModalOpen,
    
    // Assets
    assets: MOCK_ASSETS,
    
    // Mutations
    initializeILProtection: initializeILMutation,
    rebalance: rebalanceMutation,
    
    // Direct handlers (if needed)
    handleInitializeILProtection,
    handleRebalance
  };
}