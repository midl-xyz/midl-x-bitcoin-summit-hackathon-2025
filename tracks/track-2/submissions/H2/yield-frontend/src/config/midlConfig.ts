// MIDL Configuration Constants

/** Transaction confirmation timeout in milliseconds (30 seconds) */
export const TX_CONFIRMATION_TIME = 30 * 1000;

/** Default transaction polling interval in milliseconds */
export const TX_POLLING_INTERVAL = 1000;

/** Maximum retries for transaction confirmation */
export const MAX_TX_RETRIES = 3;

/** BTC network configurations */
export const BTC_NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet', 
  REGTEST: 'regtest'
} as const;

/** Default BTC network */
export const DEFAULT_BTC_NETWORK = BTC_NETWORKS.REGTEST;

/** Transaction fee rates (sat/vB) */
export const FEE_RATES = {
  SLOW: 1,
  NORMAL: 5,
  FAST: 10
} as const;

export type BTCNetwork = typeof BTC_NETWORKS[keyof typeof BTC_NETWORKS];