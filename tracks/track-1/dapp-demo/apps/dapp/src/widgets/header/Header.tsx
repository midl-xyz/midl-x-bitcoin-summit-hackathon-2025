"use client";

import { useConfig } from "@midl/react";
import { ConnectButton } from "@midl/satoshi-kit";
import { ArrowDownUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export const Header = () => {
	const { network } = useConfig();
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	return (
		<div className="sticky top-4 z-10 mx-4">
			<div className="mx-auto max-w-5xl px-6 py-2 flex items-center justify-between gap-3 bg-bc-yellow border-solid border-bc-black rounded-full shadow-sm">
				<div className="flex items-center gap-2">
					<Link href="/lend">
						<Image src="/bitcreditlogo.svg" alt="BitCredit Logo" width={120} height={26} />
					</Link>
				</div>

				<div className="flex items-center gap-6">
					<Link href="/lend" className="text-sm font-medium hover:scale-105 transition-colors">
						LEND
					</Link>
					<Link href="/borrow" className="text-sm font-medium hover:scale-105 transition-colors">
						BORROW
					</Link>
					<Link href="/transactions" className="text-sm font-medium hover:scale-105 transition-colors">
						MY TRANSACTIONS
					</Link>
					<Link href="/about" className="text-sm font-medium hover:scale-105 transition-colors">
						ABOUT
					</Link>
				</div>

				<div className="flex items-center gap-2">
					{isClient && (
						<Badge variant="outline" className="rounded-xl capitalize">
							{network.id}
						</Badge>
					)}
					<ConnectButton/>
				</div>
			</div>
		</div>
	);
};
