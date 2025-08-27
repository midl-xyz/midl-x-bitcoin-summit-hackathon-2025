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
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-3 bg-bc-yellow border-solid border-bc-black rounded-full shadow-sm">
				<div className="flex items-center gap-2">
					<Link href="/lend">
						<Image 
							src="/bitcreditlogo.svg" 
							alt="BitCredit Logo" 
							width={120} 
							height={26}
							className="w-20 sm:w-24 md:w-28 lg:w-32 xl:w-36"
						/>
					</Link>
				</div>

				<div className="hidden sm:flex items-center gap-3 md:gap-4 lg:gap-6">
					<Link href="/lend" className="text-sm-responsive font-medium hover:scale-105 transition-colors">
						LEND
					</Link>
					<Link href="/borrow" className="text-sm-responsive font-medium hover:scale-105 transition-colors">
						BORROW
					</Link>
					<Link href="/transactions" className="text-sm-responsive font-medium hover:scale-105 transition-colors">
						MY TRANSACTIONS
					</Link>
					<Link href="/about" className="text-sm-responsive font-medium hover:scale-105 transition-colors">
						ABOUT
					</Link>
				</div>

				{/* Mobile Navigation - Hamburger Menu Placeholder */}
				<div className="sm:hidden flex items-center">
					<button className="p-2">
						<svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>

				<div className="flex items-center gap-2">
					{isClient && (
						<Badge variant="outline" className="rounded-xl capitalize text-xs-responsive">
							{network.id}
						</Badge>
					)}
					<ConnectButton/>
				</div>
			</div>
		</div>
	);
};
