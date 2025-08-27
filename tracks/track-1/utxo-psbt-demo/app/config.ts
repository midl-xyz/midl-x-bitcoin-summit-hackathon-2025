import { regtest } from "@midl/core";
import { createMidlConfig } from "@midl/satoshi-kit";
import { QueryClient } from "@tanstack/react-query";
import { CustomMempoolSpaceProvider } from "./providers/MempoolSpaceProvider";

export const midlConfig = createMidlConfig({
  networks: [regtest],
  persist: true,
  provider: new CustomMempoolSpaceProvider({
    regtest: "https://0b1ecfc5c6e4.ngrok-free.app",
  } as any),
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      experimental_prefetchInRender: true,
    },
  },
});
