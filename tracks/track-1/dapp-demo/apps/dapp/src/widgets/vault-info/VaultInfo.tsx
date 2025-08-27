"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRuneStore } from "@/features";
import { shortenAddress } from "@/shared";
import { abi, address } from "@/shared/contracts/Vault";
import { useERC20Rune, useEVMAddress, useToken } from "@midl/executor-react";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import { type Address, formatUnits } from "viem";
import { useReadContract } from "wagmi";

export const VaultInfo = () => {
	const { rune: runeId } = useRuneStore();

	// biome-ignore lint/style/noNonNullAssertion: runeId is defined if the user has selected a rune
	const { erc20Address: token } = useERC20Rune(runeId!, {
		query: {
			enabled: Boolean(runeId),
		},
	});

	// This is just a showcase of how to get rune from the token address.
	const { rune } = useToken(token as `0x${string}`, {
		query: {
			enabled: Boolean(token),
		},
	});

	const evmAddress = useEVMAddress();

	const {
		data: deposit,
		refetch,
		isFetching,
	} = useReadContract({
		abi,
		address,
		functionName: "getBalance",
		args: [token as Address, evmAddress],
		query: {
			enabled: Boolean(token) && Boolean(evmAddress),
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Vault</CardTitle>
				<CardDescription>
					Simple contract with deposit & withdraw. You can view the source code
					in
					<Badge variant="secondary" className="rounded-xl inline">
						<code className="text-xs font-mono">
							packages/contracts/contracts/Vault.sol
						</code>
					</Badge>
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">Contract</span>
					<Tooltip>
						<TooltipTrigger asChild>
							<Link
								href={`https://blockscout.regtest.midl.xyz/address/${address}`}
								className="text-sm font-medium text-blue-500 hover:text-blue-700"
								target="_blank"
							>
								<code className="text-xs font-mono">
									{shortenAddress(address as `0x${string}`)}
								</code>
							</Link>
						</TooltipTrigger>
						<TooltipContent>{address as `0x${string}`}</TooltipContent>
					</Tooltip>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-sm text-muted-foreground">Selected token</span>
					<Badge variant="secondary" className="rounded-xl">
						{rune ? rune.spaced_name : "—"}
					</Badge>
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<span className="text-sm">Your deposited balance</span>
					<div className="flex items-center gap-2">
						<span className="font-medium">
							{deposit
								? /** biome-ignore lint/style/noNonNullAssertion: Rune is defined if token is provided */
									formatUnits(deposit, rune!.divisibility)
								: isFetching
									? ""
									: "0"}{" "}
							{rune?.symbol}
						</span>
						<Button
							size="icon"
							variant="ghost"
							className="h-7 w-7"
							onClick={() => refetch()}
						>
							<RefreshCw
								className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
							/>
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};
