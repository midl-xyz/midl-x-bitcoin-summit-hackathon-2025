import { Address } from 'viem';

// Asset type for Helios protocol
export interface Asset {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  isBTCAsset?: boolean;
}

// Position data
export interface HeliosPosition {
  id: string;
  user: Address;
  collateral: bigint;
  debt: bigint;
  healthFactor: number;
  ltv: number;
  liquidationThreshold: number;
}

// Protocol data
export interface ProtocolData {
  totalSupplied: bigint;
  totalBorrowed: bigint;
  utilizationRate: number;
  supplyAPY: number;
  borrowAPY: number;
}

// Error types
export class HeliosError extends Error {
  code: string;
  
  constructor(message: string, code: string) {
    super(message);
    this.name = 'HeliosError';
    this.code = code;
  }
}