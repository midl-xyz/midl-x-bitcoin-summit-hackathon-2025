"use client";

import { Header } from "@/widgets";
import { Bitcoin } from "lucide-react";

export default function TransactionsPage() {
	return (
		<>
			<div className="w-full mx-auto px-4 py-6">
				{/* Header */}
				<div className="bg-bc-yellow border-bc-black rounded-lg px-6 py-4 mb-8 text-center">
					<h1 className="text-2xl font-bold text-bc-black uppercase">MY TRANSACTIONS</h1>
				</div>

				{/* Transaction Cards Grid - 2 rows x 3 columns */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{/* Generate 6 identical transaction cards */}
					{Array.from({ length: 6 }).map((_, index) => (
						<div key={index} className="bg-white border-bc-black rounded-lg p-6 shadow-md">
							{/* Top Section - Asset */}
							<div className="flex items-center gap-3 mb-6">
								<div className="bg-bc-orange rounded-full p-3">
									<Bitcoin className="h-6 w-6 text-white" />
								</div>
								<span className="text-lg font-semibold text-bc-black">SBTC</span>
							</div>

							{/* Data Display - Two Columns */}
							<div className="grid grid-cols-2 gap-6 mb-6">
								{/* Left Column */}
								<div className="space-y-3">
									<div>
										<div className="text-sm text-bc-black mb-1">Liquidity</div>
										<div className="text-lg font-bold text-bc-black">254m</div>
									</div>
									<div>
										<div className="text-sm text-bc-black mb-1">Interest APR</div>
										<div className="text-lg font-bold text-bc-black">5.50%</div>
									</div>
								</div>

								{/* Right Column */}
								<div className="space-y-3">
									<div>
										<div className="text-sm text-bc-black mb-1">Balance</div>
										<div className="text-lg font-bold text-bc-black">1000000.012m</div>
									</div>
									<div>
										<div className="text-sm text-bc-black mb-1">Profit</div>
										<div className="flex items-center gap-2">
											<span className="text-green-500 text-lg">$</span>
											<span className="text-lg font-bold text-bc-black">0.09</span>
										</div>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button className="flex-1 bg-bc-yellow text-bc-black py-3 px-4 rounded-lg font-semibold uppercase border-bc-black">
									UNLEND
								</button>
								<button className="flex-1 bg-bc-black text-white py-3 px-4 rounded-lg font-semibold uppercase border-bc-black">
									LEND MORE
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}
