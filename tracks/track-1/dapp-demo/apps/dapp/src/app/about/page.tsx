"use client";

import { Bitcoin, Shield, Zap, Users, TrendingUp, Globe } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
	return (
		<>
			<div className="w-full mx-auto px-4 py-6">
				{/* Hero Section */}
				<div className="text-center mb-12 card-animate">
					<div className="bg-bc-yellow border-bc-black rounded-lg px-8 py-6 mb-8">
						<h1 className="text-4xl font-bold text-bc-black mb-4">About BitCredit</h1>
						<p className="text-lg text-bc-black max-w-3xl mx-auto">
							The future of Bitcoin lending and borrowing, powered by Bitcoin Runes and decentralized finance.
						</p>
					</div>
				</div>

				{/* Mission Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
					<div className="card-animate card-animate-delay-1">
						<div className="bg-white border-bc-black rounded-lg p-6 shadow-lg">
							<div className="flex items-center gap-4 mb-4">
								<div className="bg-bc-orange rounded-full p-3">
									<Bitcoin className="h-8 w-8 text-white" />
								</div>
								<h2 className="text-2xl font-bold text-bc-black">Our Mission</h2>
							</div>
							<p className="text-bc-black leading-relaxed">
								BitCredit is revolutionizing the Bitcoin ecosystem by enabling users to lend and borrow Bitcoin Runes 
								through a secure, decentralized platform. We believe in the power of Bitcoin as the foundation for 
								a new financial system that's transparent, accessible, and user-controlled.
							</p>
						</div>
					</div>

					<div className="card-animate card-animate-delay-2">
						<div className="bg-white border-bc-black rounded-lg p-6 shadow-lg">
							<div className="flex items-center gap-4 mb-4">
								<div className="bg-bc-orange rounded-full p-3">
									<Shield className="h-8 w-8 text-white" />
								</div>
								<h2 className="text-2xl font-bold text-bc-black">Security First</h2>
							</div>
							<p className="text-bc-black leading-relaxed">
								Built on Bitcoin's robust security model, BitCredit leverages smart contracts and cryptographic 
								principles to ensure your assets are always protected. Our platform operates with full transparency 
								and verifiable security measures.
							</p>
						</div>
					</div>
				</div>

				{/* Features Section */}
				<div className="mb-12 card-animate card-animate-delay-3">
					<div className="bg-white border-bc-black rounded-lg p-8 shadow-lg">
						<h2 className="text-3xl font-bold text-bc-black text-center mb-8">Platform Features</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							<div className="text-center">
								<div className="bg-bc-yellow rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
									<Zap className="h-8 w-8 text-bc-black" />
								</div>
								<h3 className="text-xl font-bold text-bc-black mb-2">Fast Transactions</h3>
								<p className="text-bc-muted">Instant lending and borrowing with Bitcoin's lightning-fast network</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-yellow rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
									<Users className="h-8 w-8 text-bc-black" />
								</div>
								<h3 className="text-xl font-bold text-bc-black mb-2">User-Friendly</h3>
								<p className="text-bc-muted">Intuitive interface designed for both beginners and experts</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-yellow rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
									<TrendingUp className="h-8 w-8 text-bc-black" />
								</div>
								<h3 className="text-xl font-bold text-bc-black mb-2">Competitive Rates</h3>
								<p className="text-bc-muted">Market-driven interest rates for optimal returns</p>
							</div>
						</div>
					</div>
				</div>

				{/* Technology Section */}
				<div className="mb-12 card-animate card-animate-delay-4">
					<div className="bg-white border-bc-black rounded-lg p-8 shadow-lg">
						<h2 className="text-3xl font-bold text-bc-black text-center mb-8">Technology Stack</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
							<div>
								<h3 className="text-xl font-bold text-bc-black mb-4">Bitcoin Runes</h3>
								<p className="text-bc-black mb-4">
									Built on Bitcoin's native Runes protocol, enabling tokenized assets and smart contract functionality 
									directly on the Bitcoin blockchain.
								</p>
								<ul className="space-y-2 text-bc-black">
									<li>• Native Bitcoin integration</li>
									<li>• Secure smart contracts</li>
									<li>• Decentralized governance</li>
								</ul>
							</div>
							<div>
								<h3 className="text-xl font-bold text-bc-black mb-4">DeFi Infrastructure</h3>
								<p className="text-bc-black mb-4">
									Advanced DeFi protocols built specifically for Bitcoin, providing lending, borrowing, and 
									liquidity management capabilities.
								</p>
								<ul className="space-y-2 text-bc-black">
									<li>• Automated market making</li>
									<li>• Collateral management</li>
									<li>• Risk assessment algorithms</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* Stats Section */}
				<div className="mb-12 card-animate card-animate-delay-5">
					<div className="bg-bc-yellow border-bc-black rounded-lg p-8">
						<h2 className="text-3xl font-bold text-bc-black text-center mb-8">Platform Statistics</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
							<div>
								<div className="text-3xl font-bold text-bc-black">$50M+</div>
								<div className="text-bc-black">Total Value Locked</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-bc-black">10K+</div>
								<div className="text-bc-black">Active Users</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-bc-black">99.9%</div>
								<div className="text-bc-black">Uptime</div>
							</div>
							<div>
								<div className="text-3xl font-bold text-bc-black">24/7</div>
								<div className="text-bc-black">Support</div>
							</div>
						</div>
					</div>
				</div>

				{/* Team Section */}
				<div className="mb-12 card-animate card-animate-delay-6">
					<div className="bg-white border-bc-black rounded-lg p-8 shadow-lg">
						<h2 className="text-3xl font-bold text-bc-black text-center mb-8">Our Team</h2>
						<p className="text-bc-black text-center mb-8 max-w-3xl mx-auto">
							BitCredit is built by a team of Bitcoin enthusiasts, blockchain developers, and DeFi experts 
							who are passionate about creating the future of decentralized finance on Bitcoin.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
									<Users className="h-10 w-10 text-white" />
								</div>
								<h3 className="text-xl font-bold text-bc-black mb-2">Development Team</h3>
								<p className="text-bc-muted">Expert blockchain developers with years of Bitcoin experience</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
									<Shield className="h-10 w-10 text-white" />
								</div>
								<h3 className="text-xl font-bold text-bc-black mb-2">Security Team</h3>
								<p className="text-bc-muted">Cryptographic experts ensuring platform security</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
									<Globe className="h-10 w-10 text-white" />
								</div>
								<h3 className="text-xl font-bold text-bc-black mb-2">Community Team</h3>
								<p className="text-bc-muted">Building and growing the BitCredit ecosystem</p>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="text-center card-animate card-animate-delay-6">
					<div className="bg-white border-bc-black rounded-lg p-8 shadow-lg">
						<h2 className="text-3xl font-bold text-bc-black mb-4">Ready to Get Started?</h2>
						<p className="text-bc-black mb-6 max-w-2xl mx-auto">
							Join thousands of users who are already earning and borrowing with Bitcoin Runes on BitCredit.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link 
								href="/lend"
								className="bg-bc-black text-white py-4 px-8 rounded-lg font-bold text-lg border-2 border-white hover:bg-bc-black/90 transition-colors"
							>
								Start Lending
							</Link>
							<Link 
								href="/borrow"
								className="bg-bc-yellow text-bc-black py-4 px-8 rounded-lg font-bold text-lg border-bc-black hover:bg-bc-yellow/90 transition-colors"
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
