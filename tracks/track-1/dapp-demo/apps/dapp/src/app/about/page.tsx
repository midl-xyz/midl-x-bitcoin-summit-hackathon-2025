"use client";

import { Bitcoin, Shield, Zap, Users, TrendingUp, Globe, Code, Database, Rocket, Cpu, Server, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function AboutPage() {
	const [activeTab, setActiveTab] = useState('indexer');

	return (
		<>
			<div className="w-full mx-auto px-4 py-6">
				{/* Hero Section */}
				<div className="text-center mb-12 card-animate">
					<div className="bg-bc-yellow border-bc-black rounded-lg px-8 py-6 mb-8">
						<div className="flex justify-center mb-6">
							<img 
								src="/bitcreditlogo.svg" 
								alt="BitCredit Logo" 
								className="h-16 sm:h-20 md:h-24 lg:h-28 xl:h-32 w-auto"
							/>
						</div>
						<h1 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-4"> UTXO Indexer-Selector</h1>
						<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black max-w-4xl mx-auto">
							A high-performance UTXO indexer and selector for Bitcoin regtest, built in Rust. 
							Making Bitcoin applications faster, lighter, and more private through efficient UTXO management.
						</p>
					</div>
				</div>

				{/* Project Overview Section */}
				<div className="mb-12 card-animate card-animate-delay-1">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<div className="flex items-center gap-4 mb-6">
							<div className="bg-bc-orange rounded-full p-3 lg:p-4">
								<Rocket className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
							</div>
							<h2 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black">High-Performance Bitcoin Infrastructure</h2>
						</div>
						<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black leading-relaxed mb-6">
							Built during the MIDL Bitcoin Summit Hackathon 2025, our BitCredit UTXO Indexer-Selector provides efficient indexing, 
							aggregation, and selection services that make Bitcoin applications faster, lighter, and more private. 
							This Rust-based solution addresses the critical need for optimized UTXO management in modern Bitcoin applications.
						</p>
						<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black leading-relaxed">
							Our project focuses on solving real-world performance bottlenecks in Bitcoin DeFi applications, 
							particularly the need for fast, efficient UTXO selection and indexing that scales with user demand.
						</p>
					</div>
				</div>

				{/* Core Features Section */}
				<div className="mb-12">
					<div className="card-animate card-animate-delay-2">
						<div className="bg-white border-bc-black rounded-lg p-6 lg:p-8 shadow-lg">
							{/* Toggle Buttons */}
							<div className="flex justify-center mb-6">
								<div className="bg-bc-muted border-bc-black rounded-lg p-1 flex">
									<button 
										onClick={() => setActiveTab('indexer')}
										className={`px-6 py-3 rounded-md font-medium text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl transition-colors ${
											activeTab === 'indexer' 
												? 'bg-bc-orange text-white' 
												: 'text-bc-black hover:bg-bc-yellow'
										}`}
									>
										UTXO Indexer
									</button>
									<button 
										onClick={() => setActiveTab('selector')}
										className={`px-6 py-3 rounded-md font-medium text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl transition-colors ${
											activeTab === 'selector' 
												? 'bg-bc-orange text-white' 
												: 'text-bc-black hover:bg-bc-yellow'
										}`}
									>
										UTXO Selector
									</button>
								</div>
							</div>

							{/* Indexer Content */}
							{activeTab === 'indexer' && (
								<div className="text-center">
									<div className="flex items-center justify-center gap-4 mb-4">
										<div className="bg-bc-orange rounded-full p-3 lg:p-4">
											<Database className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
										</div>
										<h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black">UTXO Indexer</h2>
									</div>
									<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black leading-relaxed mb-4">
										Real-time indexing of Bitcoin blocks and transactions with advanced features:
									</p>
									<ul className="space-y-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black text-left max-w-2xl mx-auto">
										<li>• <strong>Real-time indexing</strong> of Bitcoin blocks and transactions</li>
										<li>• <strong>Efficient storage</strong> using RocksDB with compression</li>
										<li>• <strong>Incremental sync</strong> with configurable batch processing</li>
										<li>• <strong>Automatic monitoring</strong> for new blocks</li>
										<li>• <strong>Comprehensive statistics</strong> and progress tracking</li>
									</ul>
								</div>
							)}

							{/* Selector Content */}
							{activeTab === 'selector' && (
								<div className="text-center">
									<div className="flex items-center justify-center gap-4 mb-4">
										<div className="bg-bc-orange rounded-full p-3 lg:p-4">
											<Cpu className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
										</div>
										<h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black">UTXO Selector</h2>
									</div>
									<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black leading-relaxed mb-4">
										Advanced selection algorithms for optimal UTXO management:
									</p>
									<ul className="space-y-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black text-left max-w-2xl mx-auto">
										<li>• <strong>Multiple selection algorithms:</strong></li>
										<li className="ml-4">- Largest-first (minimize UTXOs count)</li>
										<li className="ml-4">- Smallest-first (minimize change)</li>
										<li className="ml-4">- Oldest-first (prioritize confirmed UTXOs)</li>
										<li className="ml-4">- Newest-first (spend fresh UTXOs)</li>
										<li className="ml-4">- Branch-and-bound (optimal selection)</li>
										<li className="ml-4">- Knapsack (dynamic programming)</li>
										<li className="ml-4">- Effective value (fee-aware selection)</li>
										<li>• <strong>Advanced filtering</strong> by amount, confirmations, script types</li>
										<li>• <strong>Batch selection</strong> for multiple targets</li>
										<li>• <strong>Optimal strategy selection</strong> with automatic scoring</li>
									</ul>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Architecture Section */}
				<div className="mb-12">
					<h2 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black text-center mb-8">System Architecture</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
						<div className="card-animate card-animate-delay-4 h-full">
							<div className="bg-white border-bc-black rounded-lg p-6 lg:p-8 shadow-lg h-full">
								<h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-bc-black mb-4">Rust-Based Architecture</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black mb-4 leading-relaxed">
									Built with Rust for maximum performance and safety, featuring async/await with tokio runtime 
									and Arc-based shared state management for thread-safe operations.
								</p>
								<ul className="space-y-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">
									<li>• Tokio async runtime for concurrent operations</li>
									<li>• Arc-based shared RocksDB storage</li>
									<li>• Bitcoin Core RPC integration</li>
									<li>• RESTful API with Axum framework</li>
								</ul>
							</div>
						</div>
						<div className="card-animate card-animate-delay-5 h-full">
							<div className="bg-white border-bc-black rounded-lg p-6 lg:p-8 shadow-lg h-full">
								<h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-bc-black mb-4">Performance Optimizations</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black mb-4 leading-relaxed">
									Optimized for high-throughput Bitcoin applications with advanced caching and indexing strategies.
								</p>
								<ul className="space-y-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">
									<li>• RocksDB with compression and caching</li>
									<li>• Multiple database indices for fast queries</li>
									<li>• Batch processing for efficiency</li>
									<li>• Real-time block monitoring</li>
								</ul>
							</div>
						</div>
					</div>
				</div>


				{/* Selection Strategies Section */}
				<div className="mb-12 card-animate card-animate-delay-6">
					<div className="bg-bc-yellow border-bc-black rounded-lg p-8 lg:p-12">
						<h2 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black text-center mb-8">UTXO Selection Strategies</h2>
						
						<div className="overflow-x-auto">
							<table className="w-full bg-white border-bc-black rounded-lg shadow-lg">
								<thead>
									<tr className="bg-bc-orange text-white">
										<th className="text-left p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">Strategy</th>
										<th className="text-left p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">Use Case</th>
										<th className="text-left p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">Pros</th>
										<th className="text-left p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">Cons</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-b border-gray-200 hover:bg-gray-50">
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-bc-black">Largest First</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Quick selection</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Minimal UTXOs</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Higher change</td>
									</tr>
									<tr className="border-b border-gray-200 hover:bg-gray-50">
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-bc-black">Smallest First</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Minimize change</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Lower change amount</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">More UTXOs</td>
									</tr>
									<tr className="border-b border-gray-200 hover:bg-gray-50">
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-bc-black">Oldest First</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Prefer confirmed</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">High security</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">May use large UTXOs</td>
									</tr>
									<tr className="border-b border-gray-200 hover:bg-gray-50">
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-bc-black">Newest First</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Spend fresh coins</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Use recent UTXOs</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Lower confirmations</td>
									</tr>
									<tr className="border-b border-gray-200 hover:bg-gray-50">
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-bc-black">Branch & Bound</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Optimal selection</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Minimal waste</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Higher computation</td>
									</tr>
									<tr className="hover:bg-gray-50">
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-medium text-bc-black">Knapsack</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Complex optimization</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Very optimal</td>
										<td className="p-4 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Resource intensive</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>

				{/* API Integration Section */}
				<div className="mb-12 card-animate card-animate-delay-6">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<h2 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black text-center mb-8">REST API Integration</h2>
						<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black text-center mb-8 max-w-4xl mx-auto leading-relaxed">
							Comprehensive REST API for seamless integration with Bitcoin applications, featuring real-time statistics, 
							advanced queries, and UTXO distribution analysis.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-bc-black mb-4">Core Endpoints</h3>
								<ul className="space-y-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">
									<li>• GET /health - Health check</li>
									<li>• GET /stats - Index statistics</li>
									<li>• GET /utxos - List UTXOs with pagination</li>
									<li>• POST /select - UTXO selection</li>
									<li>• POST /select/optimal - Optimal selection</li>
									<li>• GET /analysis/distribution - UTXO analysis</li>
								</ul>
							</div>
							<div>
								<h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-bc-black mb-4">Advanced Features</h3>
								<ul className="space-y-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">
									<li>• Real-time statistics and monitoring</li>
									<li>• Advanced queries with filtering</li>
									<li>• Batch selection for multiple targets</li>
									<li>• CORS support for web applications</li>
									<li>• JSON serialization with serde</li>
									<li>• Comprehensive error handling</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="text-center card-animate card-animate-delay-6">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<h2 className="text-xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-4">Experience High-Performance Bitcoin Infrastructure</h2>
						<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black mb-6 max-w-3xl mx-auto leading-relaxed">
							Try BitCredit's lightning-fast UTXO Indexer-Selector built with Rust. 
							Join the revolution in efficient Bitcoin UTXO management.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link 
								href="/lend"
								className="bg-bc-black text-white py-4 px-8 lg:py-6 lg:px-12 rounded-lg font-bold text-base lg:text-lg xl:text-xl border-2 border-white hover:bg-bc-black/90 transition-colors"
							>
								Start Lending
							</Link>
							<Link 
								href="/borrow"
								className="bg-bc-yellow text-bc-black py-4 px-8 lg:py-6 lg:px-12 rounded-lg font-bold text-base lg:text-lg xl:text-xl border-bc-black hover:bg-bc-yellow/90 transition-colors"
							>
								Start Borrowing
							</Link>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}
