'use client';

import { useAave } from './useAave';
import { useUniswap } from './useUniswap';
import { useWeb3 } from '../useWeb3';
import { toast } from 'sonner';

export interface PositionParams {
  collateralBtc: string;
  bufferUsdc: string;
  targetLtv: number;
  rebalanceThreshold: number;
}

export interface RebalanceParams {
  currentPrice: number;
  targetDebt: string;
  lpWithdrawPercent?: number;
}

export const useHeliosPosition = () => {
  const { address } = useWeb3();
  const { supplyCollateral, borrowUSDC, repayUSDC, withdrawCollateral } = useAave();
  const { addLiquidity, removeLiquidity } = useUniswap();

  // Open a new Helios position
  const openPosition = async (params: PositionParams) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.info('Opening position...');
      
      // Step 1: Supply BTC collateral to Aave
      toast.info('Step 1/3: Supplying collateral to Aave...');
      await supplyCollateral('0x...', params.collateralBtc, address); // TODO: Use actual WBTC address
      
      // Step 2: Borrow USDC based on target LTV
      const borrowAmount = (parseFloat(params.collateralBtc) * 100000 * params.targetLtv / 100).toString(); // Assuming $100k BTC price
      toast.info('Step 2/3: Borrowing USDC...');
      await borrowUSDC(borrowAmount, address);
      
      // Step 3: Add liquidity to Uniswap
      const lpUsdcAmount = (parseFloat(borrowAmount) - parseFloat(params.bufferUsdc)).toString();
      const lpBtcAmount = (parseFloat(lpUsdcAmount) / 100000).toString(); // Convert USDC to BTC amount
      
      toast.info('Step 3/3: Adding liquidity to Uniswap...');
      await addLiquidity(lpBtcAmount, lpUsdcAmount, address);
      
      toast.success('Position opened successfully!');
      
      return {
        collateral: params.collateralBtc,
        borrowed: borrowAmount,
        lpBtc: lpBtcAmount,
        lpUsdc: lpUsdcAmount,
        buffer: params.bufferUsdc
      };
      
    } catch (error) {
      console.error('Failed to open position:', error);
      toast.error('Failed to open position. Please try again.');
      throw error;
    }
  };

  // Rebalance position based on price change
  const rebalancePosition = async (params: RebalanceParams) => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const deltaDebt = parseFloat(params.targetDebt);
      
      if (deltaDebt > 0) {
        // Need to borrow more USDC
        toast.info('Borrowing additional USDC for rebalancing...');
        await borrowUSDC(deltaDebt.toString(), address);
      } else {
        // Need to repay USDC debt
        const repayAmount = Math.abs(deltaDebt);
        
        if (params.lpWithdrawPercent && params.lpWithdrawPercent > 0) {
          // Withdraw from LP to get USDC for repayment
          toast.info('Withdrawing from LP for repayment...');
          const withdrawAmount = (params.lpWithdrawPercent / 100).toString(); // Convert percentage
          await removeLiquidity(withdrawAmount, address);
        }
        
        toast.info('Repaying USDC debt...');
        await repayUSDC(repayAmount.toString(), address);
      }
      
      toast.success('Position rebalanced successfully!');
      
    } catch (error) {
      console.error('Failed to rebalance position:', error);
      toast.error('Failed to rebalance position. Please try again.');
      throw error;
    }
  };

  // Close position
  const closePosition = async () => {
    if (!address) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      toast.info('Closing position...');
      
      // Step 1: Remove all liquidity from Uniswap
      toast.info('Step 1/3: Removing liquidity from Uniswap...');
      // TODO: Get actual LP token balance
      await removeLiquidity('100', address); // Remove 100% of liquidity
      
      // Step 2: Repay all USDC debt
      toast.info('Step 2/3: Repaying all debt...');
      // TODO: Get actual debt amount
      await repayUSDC('999999', address); // Max repayment
      
      // Step 3: Withdraw all collateral
      toast.info('Step 3/3: Withdrawing collateral...');
      // TODO: Get actual collateral amount
      await withdrawCollateral('0x...', '999999', address); // Max withdrawal
      
      toast.success('Position closed successfully!');
      
    } catch (error) {
      console.error('Failed to close position:', error);
      toast.error('Failed to close position. Please try again.');
      throw error;
    }
  };

  return {
    openPosition,
    rebalancePosition,
    closePosition,
  };
};