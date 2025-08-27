"use client";

import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ArrowUpDown, Bitcoin, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header, Deposit, VaultInfo, Withdraw } from "@/widgets";
import { RuneSelect } from "@/widgets/rune-select/RuneSelect";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BorrowSuccessData {
	amount: number;
	runeSymbol: string;
	runeName: string;
}

export default function BorrowPage() {
	const router = useRouter();
	const [collateralStates, setCollateralStates] = useState<boolean[]>(Array(5).fill(false));
	const [transactionCollateralStates, setTransactionCollateralStates] = useState<boolean[]>(Array(5).fill(false));
	const [showBorrowInterface, setShowBorrowInterface] = useState(false);
	const [borrowSuccess, setBorrowSuccess] = useState<BorrowSuccessData | null>(null);

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

	const handleBorrowClick = () => {
		setShowBorrowInterface(true);
		setBorrowSuccess(null); // Reset success state when starting new borrow
	};

	const handleBorrowSuccess = (data: BorrowSuccessData) => {
		setBorrowSuccess(data);
	};

	const handleBackToBorrow = () => {
		setBorrowSuccess(null);
		setShowBorrowInterface(false);
	};

	return (
		<>
			<div className="w-full mx-auto px-4 py-6">
				<div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
					{/* BORROW Section - Takes full width on mobile, 4/6 on desktop */}
					<div className="w-full lg:flex-[4] card-animate">
						{borrowSuccess ? (
							// Success Card
							<div className="w-full bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
								<div className="text-center">
									<div className="bg-green-100 border-green-500 rounded-full p-6 w-24 h-24 lg:w-32 lg:h-32 mx-auto mb-6 flex items-center justify-center">
										<CheckCircle className="h-16 w-16 lg:h-20 lg:w-20 text-green-600" />
									</div>
									<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-bc-black mb-6">Borrow Successful!</h1>
									
									<div className="bg-bc-yellow border-bc-black rounded-lg p-8 lg:p-12 mb-8">
										<div className="flex items-center gap-8">
											<div className="bg-bc-orange rounded-full p-6 lg:p-8">
												<Bitcoin className="h-16 w-16 lg:h-20 lg:w-20 text-white" />
											</div>
											<div className="text-left">
												<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-bc-black">BORROWED</div>
												<div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-bc-black">
													{borrowSuccess.amount} {borrowSuccess.runeSymbol}
												</div>
												<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-bc-black">
													{borrowSuccess.runeName}
												</div>
											</div>
										</div>
									</div>

									<div className="space-y-6">
										<button 
											onClick={handleBackToBorrow}
											className="w-full bg-bc-black text-white py-6 lg:py-8 px-8 rounded-lg font-bold text-xl lg:text-2xl xl:text-3xl border-2 border-white hover:bg-bc-black/90 transition-colors"
										>
											BORROW MORE
										</button>
										<button 
											onClick={() => router.push('/transactions')}
											className="w-full bg-bc-yellow text-bc-black py-4 lg:py-6 px-8 rounded-lg font-medium text-lg lg:text-xl xl:text-2xl border-bc-black hover:bg-bc-yellow/90 transition-colors"
										>
											VIEW TRANSACTIONS
										</button>
									</div>
								</div>
							</div>
						) : !showBorrowInterface ? (
							// Original BORROW interface
							<div className="w-full bg-bc-muted border-bc-black rounded-lg p-6 lg:p-8 shadow-lg">
								{/* Header */}
								<div className="bg-bc-yellow border-bc-black rounded-lg px-6 py-4 mb-6 lg:mb-8 shadow-md">
									<h2 className="text-xl sm:text-xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-bc-black">BORROW VAULTS</h2>
								</div>
								
								{/* Column Headers */}
								<div className="hidden lg:flex justify-between items-center mb-6 text-lg font-medium text-bc-black">
									<div className="flex items-center gap-3 flex-1">
										Asset
									</div>
									<div className="flex items-center gap-3 flex-1">
										Borrow Rate
									</div>
									<div className="flex items-center gap-3 flex-1">
										Liquidity
									</div>
									<div className="flex items-center gap-3 flex-1">
										Collateral
									</div>
									<div className="flex items-center gap-3 flex-1">
										Action
									</div>
								</div>
								
								{/* Asset Rows */}
								<div className="space-y-4">
									{Array.from({ length: 5 }).map((_, index) => (
										<div key={index} className="w-full bg-white border-bc-black rounded-lg p-4 lg:p-6 shadow-md">
											{/* Desktop Layout */}
											<div className="hidden lg:flex items-center justify-between">
												<div className="flex items-center gap-3 flex-1">
													<div className="bg-bc-orange rounded-full p-3 lg:p-4">
														<Bitcoin className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
													</div>
													<span className="font-medium text-lg lg:text-xl">SBTC</span>
												</div>
												<div className="flex-1 text-left text-bc-black text-lg lg:text-xl">5.25%</div>
												<div className="flex-1 text-left text-bc-black text-lg lg:text-xl">
													<div>50.2k available</div>
													<div className="text-base text-gray-600">0 borrowed</div>
												</div>
												<div className="flex-1 flex justify-start">
													<Toggle
														checked={collateralStates[index]}
														onChange={(checked) => handleCollateralChange(index, checked)}
														size="lg"
													/>
												</div>
												<div className="flex-1 flex justify-start">
													<button 
														onClick={handleBorrowClick}
														className="bg-bc-yellow text-bc-black px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-medium text-lg lg:text-xl shadow-sm"
													>
														BORROW
													</button>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						) : (
							// New BORROW BTC interface
							<div className="w-full bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
								{/* Header */}
								<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-bc-black mb-8">BORROW</h1>
								
								{/* Interest Rate Display */}
								<div className="bg-bc-yellow border-bc-black rounded-lg p-8 lg:p-12 mb-8">
									<div className="flex items-center gap-8">
										<div className="bg-bc-orange rounded-full p-6 lg:p-8">
											<Bitcoin className="h-16 w-16 lg:h-20 lg:w-20 text-white" />
										</div>
										<div>
											<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-bc-black">INTEREST APR</div>
											<div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-bc-black">19%</div>
											<div className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-medium text-bc-black">

											</div>
										</div>
									</div>
								</div>
								
								{/* BORROW Amount Input */}
								<div className="mb-8">
									<RuneSelect />
									<Withdraw onSuccess={handleBorrowSuccess} />
								</div>
								
								{/* Action Button - Removed since Withdraw component handles submission */}
							</div>
						)}
					</div>

					{/* TRANSACTION Section - Takes full width on mobile, 2/6 on desktop */}
					<div className="w-full lg:flex-[2] card-animate card-animate-delay-1">
						<div className="w-full rounded-lg shadow-lg">
							{/* Header */}
							<div className="bg-bc-yellow border-bc-black rounded-lg px-12 py-4 mb-6 lg:mb-8 shadow-md">
								<h2 className="text-xl sm:text-xl md:text-2xl lg:text-3xl xl:text-3xl font-bold text-bc-black">RECENT TRANSACTIONS</h2>
							</div>
							
							{/* Column Headers */}
							<div className="flex bg-white rounded-lg px-6 py-4 justify-between items-center mb-6 text-lg font-medium text-bc-black shadow-md">
								<div className="flex items-center gap-3 flex-1">Asset</div>
								<div className="flex items-center gap-3 flex-1">
									Interest
								</div>
								<div className="flex items-center gap-3 flex-1">Collateral</div>
								<div className="flex items-center gap-3 flex-1">Action</div>
							</div>
							
							{/* Transaction Rows */}
							<div className="space-y-4">
								{Array.from({ length: 5 }).map((_, index) => (
									<div key={index} className="w-full bg-white border-bc-black rounded-lg p-4 lg:p-6 shadow-md">
										<div className="flex justify-between items-center">
											<div className="flex items-center gap-3 flex-1">
												<div className="bg-bc-orange rounded-full p-3 lg:p-4">
													<Bitcoin className="h-6 w-6 lg:h-8 lg:w-8 text-white" />
												</div>
												<span className="font-medium text-lg lg:text-xl">BTC</span>
											</div>
											<div className="flex items-center gap-3 flex-1 text-bc-black text-lg lg:text-xl">3.17%</div>
											<div className="flex items-center gap-3 flex-1">
												<Toggle
													checked={transactionCollateralStates[index]}
													onChange={(checked) => handleTransactionCollateralChange(index, checked)}
													size="lg"
												/>
											</div>
											<div className="flex items-center gap-3 flex-1">
												<button className="bg-bc-yellow text-bc-black px-4 lg:px-6 py-3 lg:py-4 rounded-lg font-medium text-lg lg:text-xl shadow-sm">
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
