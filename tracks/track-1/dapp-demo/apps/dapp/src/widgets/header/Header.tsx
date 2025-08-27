"use client";

import { useConfig } from "@midl/react";
import { ConnectButton } from "@midl/satoshi-kit";
import { ArrowDownUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

export const Header = () => {
	const { network } = useConfig();

	return (
		<div className="sticky top-4 z-10 mx-4">
			<div className="mx-auto max-w-5xl px-6 py-2 flex items-center justify-between gap-3 bg-bc-yellow border-solid border-bc-black rounded-full shadow-sm">
				<div className="flex items-center gap-2">
					<div>
						<Image src="/bitcreditlogo.svg" alt="BitCredit Logo" width={120} height={26} />
					</div>
				</div>

				<div className="flex items-center gap-6">
					<Link href="/lend" className="text-sm font-medium hover:scale-105 transition-colors">
						Lend
					</Link>
					<Link href="/borrow" className="text-sm font-medium hover:scale-105 transition-colors">
						Borrow
					</Link>
					<Link href="/transactions" className="text-sm font-medium hover:scale-105 transition-colors">
						My Transactions
					</Link>
				</div>

				<div className="flex items-center gap-2">
					<Badge variant="outline" className="rounded-xl capitalize">
						{network.id}
					</Badge>
					<ConnectButton/>
				</div>
			</div>
		</div>
	);
};
