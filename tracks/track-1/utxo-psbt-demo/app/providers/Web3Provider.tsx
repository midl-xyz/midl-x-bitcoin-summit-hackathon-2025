"use client";

import { MidlProvider } from "@midl/react";
import { SatoshiKitProvider, ConnectButton } from "@midl/satoshi-kit";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMemo, type ReactNode } from "react";
import "@midl/satoshi-kit/styles.css";
import { midlConfig, queryClient } from "../config";

export function Web3Provider({ children }: { children: ReactNode }) {
  const client = useMemo(() => queryClient, []);

  return (
    <MidlProvider config={midlConfig}>
      <QueryClientProvider client={client}>
        <SatoshiKitProvider>
          <div className="flex items-center justify-between w-full mb-4">
            <div></div>
            <ConnectButton />
          </div>
          {children}
        </SatoshiKitProvider>
      </QueryClientProvider>
    </MidlProvider>
  );
}
