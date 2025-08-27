import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Deposit, VaultInfo, Withdraw } from "@/widgets";
import { RuneSelect } from "@/widgets/rune-select/RuneSelect";

export default function Home() {
	return (
		<div className="grid grid-cols-1 gap-6 md:grid-cols-[400px_1fr]">
			<div>
				<VaultInfo />
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Interact with the Vault</CardTitle>

					<CardDescription className="space-y-2">
						<div>
							Use the Vault to deposit and withdraw Bitcoin Runes. This is a
							simple contract that allows you to manage your Rune holdings.
						</div>
						<div>
							You can etch (mint) a new Rune on{" "}
							<Link
								href="https://runes.midl.xyz/"
								className="text-blue-500 hover:text-blue-700"
							>
								runes.midl.xyz
							</Link>
						</div>
						<div>
							Block explorer:{" "}
							<Link
								href="https://blockscout.regtest.midl.xyz
"
								className="text-blue-500 hover:text-blue-700"
							>
								https://blockscout.regtest.midl.xyz
							</Link>
						</div>
						<div>
							Bitcoin Block Explorer:{" "}
							<Link
								href="https://mempool.regtest.midl.xyz"
								className="text-blue-500 hover:text-blue-700"
							>
								https://mempool.regtest.midl.xyz
							</Link>
						</div>
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<Tabs defaultValue="deposit" className="w-full">
						<TabsList>
							<TabsTrigger value="deposit">Deposit</TabsTrigger>
							<TabsTrigger value="withdraw">Withdraw</TabsTrigger>
						</TabsList>
						<TabsContent value="deposit" className="space-y-3">
							<RuneSelect />

							<Deposit />
						</TabsContent>
						<TabsContent value="withdraw" className="space-y-3">
							<RuneSelect />

							<Withdraw />
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
}
