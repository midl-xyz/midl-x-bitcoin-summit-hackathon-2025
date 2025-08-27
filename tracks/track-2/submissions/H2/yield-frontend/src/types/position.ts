export type Network = 'sepolia' | 'mainnet' | 'arbitrum' | 'optimism';

export type PositionStatus = 'healthy' | 'needs_rebalance' | 'buffer_low' | 'closeable';

export interface Position {
  id: string;
  network: Network;
  p0: bigint; // Initial price
  collateralBtc: bigint; // c - collateral BTC amount
  debtUsdc: bigint; // D - total debt in USDC
  bufferUsdc: bigint; // u - buffer USDC amount
  lpK: bigint; // k = x0*y0 - LP constant product
  lpSharePct: number; // LP share percentage (0-100)
  thresholdBps: number; // 100 = 1%, 1000 = 10%
  aprBorrowBps: number; // Aave borrow APR in basis points
  aprLpBps: number; // Uniswap LP fee APR in basis points
  spotBtc: bigint; // Remaining BTC from LP withdrawal
  feesAccrued: bigint;
  interestAccrued: bigint;
  txCostsAccrued: bigint;
  lastRebalanceTs: number;
  createdAt: number;
  updatedAt: number;
}

export interface PositionMetrics {
  healthFactor: number;
  ltv: number;
  currentPrice: bigint;
  equity: bigint;
  trackingError: number;
  lpBtcAmount: bigint; // x(P) = sqrt(k/P)
  lpUsdcAmount: bigint; // y(P) = sqrt(k*P)
  status: PositionStatus;
}

export interface RebalancePreview {
  targetDebt: bigint;
  deltaDebt: bigint;
  action: 'borrow' | 'repay';
  repayFromBuffer: bigint;
  lpWithdrawPercent: number;
  estimatedGas: bigint;
  priceImpact: number;
}

export interface TransactionStep {
  id: string;
  type: 'approve' | 'supply' | 'borrow' | 'repay' | 'addLiquidity' | 'removeLiquidity' | 'withdraw';
  protocol: 'aave' | 'uniswap' | 'wallet';
  token?: string;
  amount?: bigint;
  description: string;
  estimatedGas?: bigint;
}