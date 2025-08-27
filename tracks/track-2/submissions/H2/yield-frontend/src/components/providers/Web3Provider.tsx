'use client';

import { setupBufferPolyfill } from '@/utils/bufferPolyfill';
import { MempoolSpaceProvider, regtest } from '@midl-xyz/midl-js-core';
import { WagmiMidlProvider } from '@midl-xyz/midl-js-executor-react';
import { MidlProvider } from '@midl-xyz/midl-js-react';
import { SatoshiKitProvider, createMidlConfig } from '@midl-xyz/satoshi-kit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/config/wagmiConfig';

// Apply Buffer polyfill for midl-js-executor compatibility
setupBufferPolyfill();

export const config = createMidlConfig({
  networks: [regtest],
  persist: true,
  provider: new MempoolSpaceProvider({
    regtest: 'https://mempool.regtest.midl.xyz'
  } as any) // Any is used because we don't want to give mainnet links
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <MidlProvider config={config}>
          <WagmiMidlProvider>
            <SatoshiKitProvider>
              {children}
            </SatoshiKitProvider>
          </WagmiMidlProvider>
        </MidlProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};