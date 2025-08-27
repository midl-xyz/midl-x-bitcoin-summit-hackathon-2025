"use client";

import { midlConfig, queryClient } from "@/app/config";
import { WagmiMidlProvider } from "@midl/executor-react";
import { MidlProvider } from "@midl/react";
import { SatoshiKitProvider } from "@midl/satoshi-kit";
import { QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

export default function Web3Provider({
	children,
}: {
	children: React.ReactNode;
}) {
	const client = useMemo(() => queryClient, []);

	return (
		<QueryClientProvider client={client}>
			<MidlProvider config={midlConfig}>
				<SatoshiKitProvider>
					<WagmiMidlProvider>{children}</WagmiMidlProvider>
				</SatoshiKitProvider>
			</MidlProvider>
		</QueryClientProvider>
	);
}
