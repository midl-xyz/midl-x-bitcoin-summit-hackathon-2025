import { Address } from 'viem';

// Mock Helios Pool contract for demo
export const HELIOS_POOL_ADDRESS = '0x1249eFb861890E1Cd363d798Fc979bde5A3d89F0' as Address;

// Simple pool ABI for demo
export const HELIOS_POOL_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' },
      { internalType: 'uint16', name: 'referralCode', type: 'uint16' }
    ],
    name: 'supply',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'interestRateMode', type: 'uint256' },
      { internalType: 'uint16', name: 'referralCode', type: 'uint16' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' }
    ],
    name: 'borrow',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'uint256', name: 'interestRateMode', type: 'uint256' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' }
    ],
    name: 'repay',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
      { internalType: 'address', name: 'to', type: 'address' }
    ],
    name: 'withdraw',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// Mock BTC Gateway for BTC deposits
export const BTC_GATEWAY_ADDRESS = '0x378a6121A4014E8190Fb475C971C1eD32841fb31' as Address;

export const BTC_GATEWAY_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'asset', type: 'address' },
      { internalType: 'address', name: 'onBehalfOf', type: 'address' },
      { internalType: 'uint16', name: 'referralCode', type: 'uint16' }
    ],
    name: 'depositBTC',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  }
] as const;

// Mock token addresses
export const WBTC_ADDRESS = '0xC726845d8b6f0586A12D31ec5075e47B28c8eC4A' as Address;
export const USDC_ADDRESS = '0xbfCF8593cb45725E8d81190F24468eAE49e52AF0' as Address;
export const USDT_ADDRESS = '0xe00F6dDB975C38b7d9fF8d137b9910dd651c124B' as Address;