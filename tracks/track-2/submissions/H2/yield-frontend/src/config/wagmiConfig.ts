import { midlRegtest } from '@midl-xyz/midl-js-executor';
import { sepolia, mainnet } from 'viem/chains';
import type { Chain } from 'viem';
import { createConfig, http } from 'wagmi';

export const wagmiConfig = createConfig({
  chains: [
    {
      ...midlRegtest,
      rpcUrls: {
        default: {
          http: ['https://rpc.regtest.midl.xyz/']
        }
      }
    } as Chain,
    sepolia,
    mainnet
  ],
  transports: {
    [midlRegtest.id]: http('https://rpc.regtest.midl.xyz/'),
  }
});

/**
 * Chain configuration for the application
 */
export const supportedChains = {
  midlRegtest: {
    id: midlRegtest.id,
    name: 'MIDL Regtest',
    network: 'regtest',
  },
};

export type ChainId = (typeof wagmiConfig)['chains'][number]['id'];

/**
 * Default chain for the application
 */
export const defaultChain = sepolia;