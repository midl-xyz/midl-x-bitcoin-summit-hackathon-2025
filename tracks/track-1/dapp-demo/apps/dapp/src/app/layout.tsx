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
	title: "BitCredit - Bitcoin Lending Platform",
	description:
		"Revolutionary Bitcoin lending platform built for the MIDL Bitcoin Summit Hackathon, featuring optimized backend selectors for lightning-fast performance.",
	viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
			</head>
			<Web3Provider>
				<body className={`${lexend.variable} h-screen font-sans bg-bc-grid antialiased flex flex-col`}>
					{/* Dynamic Falling Coins Background */}
					<FallingCoins />

					<Header />
					<main className="flex-1 overflow-auto">
						<div className="mx-auto max-w-full xl:max-w-10xl px-4 sm:px-6 lg:px-8 py-6 min-h-full">
							{children}
						</div>
					</main>
					<Toaster />
				</body>
			</Web3Provider>
		</html>
	);
}
