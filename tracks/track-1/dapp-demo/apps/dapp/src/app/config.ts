import { type Config, regtest } from "@midl/core";
import { createMidlConfig } from "@midl/satoshi-kit";
import { QueryClient } from "@tanstack/react-query";

export const midlConfig = createMidlConfig({
	networks: [regtest],
	persist: true,
}) as Config;

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			experimental_prefetchInRender: true,
		},
	},
});
