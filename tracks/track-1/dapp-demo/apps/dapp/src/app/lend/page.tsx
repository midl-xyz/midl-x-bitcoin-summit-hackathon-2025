"use client";

import { Header } from "@/widgets";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ArrowUpDown, Bitcoin } from "lucide-react";
import { useState } from "react";

export default function LendPage() {
	const [collateralStates, setCollateralStates] = useState<boolean[]>(Array(5).fill(false));
	const [transactionCollateralStates, setTransactionCollateralStates] = useState<boolean[]>(Array(5).fill(false));
	const [showBorrowInterface, setShowBorrowInterface] = useState(false);

	const handleCollateralChange = (index: number, checked: boolean) => {
		setCollateralStates(prev => {
			const newStates = [...prev];
			newStates[index] = checked;
			return newStates;
		});
	};

	const handleTransactionCollateralChange = (index: number, checked: boolean) => {
		setTransactionCollateralStates(prev => {
			const newStates = [...prev];
			newStates[index] = checked;
			return newStates;
		});
	};

	const handleLendClick = () => {
		setShowBorrowInterface(true);
	};

	return (
		<>
			<div className="w-full mx-auto px-4 py-6">
				<div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full">
					{/* LEND Section - Takes full width on mobile, 4/6 on desktop */}
					<div className="w-full lg:flex-[4]">
						{!showBorrowInterface ? (
							// Original LEND interface
							<div className="w-full bg-bc-muted border-bc-black rounded-lg p-4 lg:p-6 shadow-lg">
								{/* Header */}
								<div className="bg-bc-yellow border-bc-black rounded-lg px-4 py-2 mb-4 lg:mb-6 shadow-md">
									<h2 className="text-bc-black font-bold text-lg">LEND</h2>
								</div>
								
								{/* Column Headers */}
								<div className="hidden lg:flex justify-between items-center mb-4 text-sm font-medium text-bc-black">
									<div className="flex items-center gap-2 flex-1">
										Asset
									</div>
									<div className="flex items-center gap-2 flex-1">
										Lend Rate
										<ArrowUpDown className="h-4 w-4" />
									</div>
									<div className="flex items-center gap-2 flex-1">
										Liquidity
										<ArrowUpDown className="h-4 w-4" />
									</div>
									<div className="flex items-center gap-2 flex-1">
										Collateral
									</div>
									<div className="flex items-center gap-2 flex-1">
										Action
									</div>
								</div>
								
								{/* Asset Rows */}
								<div className="space-y-3">
									{Array.from({ length: 5 }).map((_, index) => (
										<div key={index} className="w-full bg-white border-bc-black rounded-lg p-3 lg:p-4 shadow-md">
											{/* Desktop Layout */}
											<div className="hidden lg:flex items-center justify-between">
												<div className="flex items-center gap-2 flex-1">
													<div className="bg-bc-orange rounded-full p-2">
														<Bitcoin className="h-4 w-4 text-white" />
													</div>
													<span className="font-medium">SBTC</span>
												</div>
												<div className="flex-1 text-left text-bc-black">3.17%</div>
												<div className="flex-1 text-left text-bc-black">
													<div>10.3k available</div>
													<div className="text-sm text-gray-600">0 borrowed</div>
												</div>
												<div className="flex-1 flex justify-start">
													<Toggle
														checked={collateralStates[index]}
														onChange={(checked) => handleCollateralChange(index, checked)}
														size="md"
													/>
												</div>
												<div className="flex-1 flex justify-start">
													<button 
														onClick={handleLendClick}
														className="bg-bc-yellow text-bc-black px-4 py-2 rounded-lg font-medium shadow-sm"
													>
														LEND
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							// New LEND BTC interface
							<div className="w-full bg-white border-bc-black rounded-lg p-6 shadow-lg">
								{/* Header */}
								<h1 className="text-3xl font-bold text-bc-black mb-6">LEND</h1>
								
								{/* Interest Rate Display */}
								<div className="bg-bc-yellow border-bc-black rounded-lg p-6 mb-6">
									<div className="flex items-center gap-6">
										<div className="bg-bc-orange rounded-full p-4">
											<Bitcoin className="h-12 w-12 text-white" />
										</div>
										<div>
											<div className="text-sm font-medium text-bc-black">INTEREST APR</div>
											<div className="text-3xl font-bold text-bc-black">19%</div>
										</div>
									</div>
								</div>
								
								{/* Lend Amount Input */}
								<div className="mb-6">
									<label className="block text-sm font-medium text-bc-black mb-2">Lend Amount</label>
									<div className="flex gap-2">
										<input 
											type="text" 
											placeholder="Enter Amount" 
											className="flex-1 px-4 py-3 border-bc-black rounded-lg bg-white"
										/>
										<button className="bg-bc-yellow text-bc-black px-4 py-3 rounded-lg font-medium border-bc-black">
											MAX
										</button>
									</div>
								</div>
								
								{/* Profit Display Cards */}
								<div className="grid grid-cols-3 gap-4 mb-6">
									<div className="bg-white border-bc-black rounded-lg p-4 text-center">
										<div className="text-sm font-medium text-bc-black">Weekly Profit</div>
										<div className="text-xl font-bold text-bc-orange">$10.00</div>
									</div>
									<div className="bg-white border-bc-black rounded-lg p-4 text-center">
										<div className="text-sm font-medium text-bc-black">Weekly Profit</div>
										<div className="text-xl font-bold text-bc-orange">$100.00</div>
									</div>
									<div className="bg-white border-bc-black rounded-lg p-4 text-center">
										<div className="text-sm font-medium text-bc-black">Yearly Profit</div>
										<div className="text-xl font-bold text-bc-orange">$1000.00</div>
									</div>
								</div>
								
								{/* Action Button */}
								<button className="w-full bg-bc-black text-white py-4 rounded-lg font-bold text-lg border-2 border-white">
									LEND 0.001 BTC
								</button>
							</div>
						)}
					</div>

					{/* TRANSACTION Section - Takes full width on mobile, 2/6 on desktop */}
					<div className="w-full lg:flex-[2]">
						<div className="w-full rounded-lg shadow-lg">
							{/* Header */}
							<div className="bg-bc-yellow border-bc-black rounded-lg px-10 py-2 mb-4 lg:mb-6 shadow-md">
								<h2 className="text-bc-black font-bold text-lg">TRANSACTION</h2>
							</div>
							
							{/* Column Headers */}
							<div className="flex bg-white rounded-lg px-4 py-2 justify-between items-center mb-4 text-sm font-medium text-bc-black shadow-md">
								<div className="flex items-center gap-2 flex-1">Asset</div>
								<div className="flex items-center gap-2 flex-1">
									Interest
									<ArrowUpDown className="h-4 w-4" />
								</div>
								<div className="flex items-center gap-2 flex-1">Collateral</div>
								<div className="flex items-center gap-2 flex-1">Action</div>
							</div>
							
							{/* Transaction Rows */}
							<div className="space-y-3">
								{Array.from({ length: 5 }).map((_, index) => (
									<div key={index} className="w-full bg-white border-bc-black rounded-lg p-3 lg:p-4 shadow-md">
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-2">
												<div className="bg-bc-orange rounded-full p-2">
													<Bitcoin className="h-4 w-4 text-white" />
												</div>
												<span className="font-medium text-sm lg:text-base">BTC</span>
											</div>
											<div className="text-bc-black text-sm lg:text-base">3.17%</div>
											<div>
												<Toggle
													checked={transactionCollateralStates[index]}
													onChange={(checked) => handleTransactionCollateralChange(index, checked)}
													size="md"
												/>
											</div>
											<div>
												<button className="bg-bc-yellow text-bc-black px-3 lg:px-4 py-2 rounded-lg font-medium text-sm lg:text-base shadow-sm">
													REPAY
												</button>
											</div>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
