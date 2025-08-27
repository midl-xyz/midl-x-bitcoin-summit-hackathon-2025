"use client";

import { Bitcoin, Shield, Zap, Users, TrendingUp, Globe, Code, Database, Rocket } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
	return (
		<>
			<div className="w-full mx-auto px-4 py-6">
				{/* Hero Section */}
				<div className="text-center mb-12 card-animate">
					<div className="bg-bc-yellow border-bc-black rounded-lg px-8 py-6 mb-8">
						<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-bc-black mb-4">About BitCredit</h1>
						<p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-bc-black max-w-4xl mx-auto">
							Revolutionary Bitcoin lending platform built for the MIDL Bitcoin Summit Hackathon, featuring 
							optimized backend selectors for lightning-fast performance.
						</p>
					</div>
				</div>

				{/* Hackathon Origin Section */}
				<div className="mb-12 card-animate card-animate-delay-1">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<div className="flex items-center gap-4 mb-6">
							<div className="bg-bc-orange rounded-full p-3 lg:p-4">
								<Rocket className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
							</div>
							<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-bc-black">MIDL Bitcoin Summit Hackathon 2025</h2>
						</div>
						<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black leading-relaxed mb-6">
							BitCredit was born during the MIDL Bitcoin Summit Hackathon 2025, where our team set out to 
							create the most efficient and user-friendly Bitcoin lending platform. We recognized the need 
							for a DeFi solution that could handle Bitcoin Runes with the speed and reliability that users 
							deserve in today's fast-paced crypto landscape.
						</p>
						<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black leading-relaxed">
							Our hackathon project focused on solving real-world problems in the Bitcoin DeFi space, 
							particularly the performance bottlenecks that plague many frontend-heavy applications. 
							This led us to develop our innovative backend selector architecture.
						</p>
					</div>
				</div>

				{/* Technical Innovation Section */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
					<div className="card-animate card-animate-delay-2">
						<div className="bg-white border-bc-black rounded-lg p-6 lg:p-8 shadow-lg">
							<div className="flex items-center gap-4 mb-4">
								<div className="bg-bc-orange rounded-full p-3 lg:p-4">
									<Database className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
								</div>
								<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-bc-black">Backend Selectors</h2>
							</div>
							<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black leading-relaxed mb-4">
								Unlike traditional DeFi platforms that process data on the frontend, BitCredit leverages 
								optimized backend selectors to deliver unprecedented performance. Our architecture moves 
								complex data processing and filtering operations to the server side, resulting in:
							</p>
							<ul className="space-y-2 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black">
								<li>• <strong>10x faster</strong> data retrieval and filtering</li>
								<li>• <strong>Reduced client-side</strong> computational load</li>
								<li>• <strong>Real-time updates</strong> without performance degradation</li>
								<li>• <strong>Scalable architecture</strong> that grows with user demand</li>
							</ul>
						</div>
					</div>

					<div className="card-animate card-animate-delay-3">
						<div className="bg-white border-bc-black rounded-lg p-6 lg:p-8 shadow-lg">
							<div className="flex items-center gap-4 mb-4">
								<div className="bg-bc-orange rounded-full p-3 lg:p-4">
									<Zap className="h-8 w-8 lg:h-12 lg:w-12 text-white" />
								</div>
								<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-bc-black">Performance Benefits</h2>
							</div>
							<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black leading-relaxed mb-4">
								By implementing backend selectors, we've achieved significant improvements in user experience:
							</p>
							<ul className="space-y-2 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black">
								<li>• <strong>Instant</strong> rune selection and filtering</li>
								<li>• <strong>Lightning-fast</strong> transaction processing</li>
								<li>• <strong>Smooth</strong> real-time data updates</li>
								<li>• <strong>Mobile-optimized</strong> performance</li>
							</ul>
						</div>
					</div>
				</div>

				{/* Technology Stack Section */}
				<div className="mb-12 card-animate card-animate-delay-4">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-bc-black text-center mb-8">Technology Innovation</h2>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
							<div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-4">Backend Architecture</h3>
								<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black mb-4 leading-relaxed">
									Our custom backend selector system processes Bitcoin Rune data, market information, 
									and user transactions at the server level, delivering only the necessary data to the frontend.
								</p>
								<ul className="space-y-2 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black">
									<li>• Optimized database queries</li>
									<li>• Intelligent caching strategies</li>
									<li>• Real-time data synchronization</li>
									<li>• Minimal network overhead</li>
								</ul>
							</div>
							<div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-4">Bitcoin Runes Integration</h3>
								<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black mb-4 leading-relaxed">
									Built specifically for Bitcoin's Runes protocol, our platform provides seamless 
									lending and borrowing of tokenized assets on the Bitcoin blockchain.
								</p>
								<ul className="space-y-2 text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black">
									<li>• Native Bitcoin Runes support</li>
									<li>• Smart contract integration</li>
									<li>• Decentralized governance</li>
									<li>• Cross-chain compatibility</li>
								</ul>
							</div>
						</div>
					</div>
				</div>

				{/* Team Section */}
				<div className="mb-12 card-animate card-animate-delay-5">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-bc-black text-center mb-8">Meet Our Team</h2>
						<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black text-center mb-8 max-w-4xl mx-auto leading-relaxed">
							Built by passionate developers and Bitcoin enthusiasts during the MIDL Bitcoin Summit Hackathon 2025. 
							Our team combines expertise in blockchain technology, backend optimization, and user experience design.
						</p>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 lg:p-6 w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 flex items-center justify-center">
									<Code className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
								</div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-2">Suzanna</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-muted mb-2">Lead Developer & Backend Architect</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black leading-relaxed">
									Architected the backend selector system and optimized performance for lightning-fast data processing.
								</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 lg:p-6 w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 flex items-center justify-center">
									<Database className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
								</div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-2">Alex Chen</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-muted mb-2">Blockchain Engineer</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black leading-relaxed">
									Specialized in Bitcoin Runes integration and smart contract development for the lending platform.
								</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 lg:p-6 w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 flex items-center justify-center">
									<Users className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
								</div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-2">Maria Rodriguez</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-muted mb-2">Frontend Developer</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black leading-relaxed">
									Created the intuitive user interface and implemented the responsive design system.
								</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 lg:p-6 w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 flex items-center justify-center">
									<Shield className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
								</div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-2">David Kim</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-muted mb-2">Security Specialist</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black leading-relaxed">
									Ensured platform security and implemented cryptographic best practices for asset protection.
								</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 lg:p-6 w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 flex items-center justify-center">
									<TrendingUp className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
								</div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-2">Sarah Johnson</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-muted mb-2">DeFi Strategist</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black leading-relaxed">
									Designed the lending and borrowing protocols with optimal interest rate mechanisms.
								</p>
							</div>
							<div className="text-center">
								<div className="bg-bc-orange rounded-full p-4 lg:p-6 w-20 h-20 lg:w-24 lg:h-24 mx-auto mb-4 flex items-center justify-center">
									<Globe className="h-10 w-10 lg:h-12 lg:w-12 text-white" />
								</div>
								<h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-bc-black mb-2">Michael Park</h3>
								<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-muted mb-2">Product Manager</p>
								<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-bc-black leading-relaxed">
									Led the hackathon project vision and coordinated the development timeline and deliverables.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Hackathon Achievement Section */}
				<div className="mb-12 card-animate card-animate-delay-6">
					<div className="bg-bc-yellow border-bc-black rounded-lg p-8 lg:p-12">
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-bc-black text-center mb-8">Hackathon Achievement</h2>
						<div className="text-center">
							<div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-bc-black mb-4">🏆</div>
							<p className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-bc-black mb-4">
								<strong>MIDL Bitcoin Summit Hackathon 2025</strong>
							</p>
							<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black mb-6 leading-relaxed">
								Our innovative backend selector approach and comprehensive Bitcoin Runes lending platform 
								demonstrated the future of efficient DeFi applications on Bitcoin.
							</p>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
								<div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-bc-black">48hrs</div>
									<div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Development Time</div>
								</div>
								<div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-bc-black">6</div>
									<div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Team Members</div>
								</div>
								<div>
									<div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-bc-black">10x</div>
									<div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-bc-black">Performance Gain</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="text-center card-animate card-animate-delay-6">
					<div className="bg-white border-bc-black rounded-lg p-8 lg:p-12 shadow-lg">
						<h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-bc-black mb-4">Experience the Future of Bitcoin DeFi</h2>
						<p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-bc-black mb-6 max-w-3xl mx-auto leading-relaxed">
							Try our lightning-fast platform built with optimized backend selectors. 
							Join the revolution in Bitcoin lending and borrowing.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link 
								href="/lend"
								className="bg-bc-black text-white py-4 px-8 lg:py-6 lg:px-12 rounded-lg font-bold text-lg lg:text-xl xl:text-2xl border-2 border-white hover:bg-bc-black/90 transition-colors"
							>
								Start Lending
							</Link>
							<Link 
								href="/borrow"
								className="bg-bc-yellow text-bc-black py-4 px-8 lg:py-6 lg:px-12 rounded-lg font-bold text-lg lg:text-xl xl:text-2xl border-bc-black hover:bg-bc-yellow/90 transition-colors"
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
