import { Toaster } from "@/components/ui/sonner";
import { Web3Provider } from "@/global";
import { Header } from "@/widgets";
import { FallingCoins } from "@/components/ui/falling-coins";
import "@midl/satoshi-kit/styles.css";
import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
	variable: "--font-lexend",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "MIDL DApp Demo",
	description:
		"A demo application for building decentralized applications with MIDL.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<Web3Provider>
				<body className={`${lexend.variable} font-sans bg-bc-grid`}>
					{/* Dynamic Falling Coins Background */}
					<FallingCoins />

					<Header />
					<div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
					<Toaster />
				</body>
			</Web3Provider>
		</html>
	);
}
