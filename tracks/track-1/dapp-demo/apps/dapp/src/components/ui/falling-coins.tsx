"use client";

import { useEffect } from "react";

// Dynamic Falling Coins Component
export const FallingCoins = () => {
	useEffect(() => {
		const container = document.createElement("div");
		container.className = "coin-container";
		container.style.cssText = `
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			pointer-events: none;
			z-index: -1;
			overflow: hidden;
		`;
		document.body.appendChild(container);

		// Function to add new coins at regular intervals
		const addCoinsInterval = setInterval(() => {
			const newCoin = document.createElement("div");
			newCoin.className = "falling-coin";
			newCoin.style.cssText = `
				position: absolute;
				top: -50px;
				left: ${Math.random() * 100}%;
				width: 50px;
				height: 50px;
				z-index: -1;
			`;
			
			// Debug logging
			console.log('New coin created with size:', newCoin.style.width, 'x', newCoin.style.height);
			
			// Create coin image
			const coinImg = document.createElement("img");
			coinImg.src = "/coin.svg";
			coinImg.alt = "Falling Coin";
			coinImg.style.cssText = `
				width: 100%;
				height: 100%;
				filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
			`;
			newCoin.appendChild(coinImg);
			
			container.appendChild(newCoin);

			// Random animation duration between 4s and 8s
			const animationDuration = 4 + Math.random() * 4;
			
			// Animate the coin falling
			newCoin.animate([
				{ transform: 'translateY(0px) rotate(0deg)', opacity: 1 },
				{ transform: `translateY(${window.innerHeight + 50}px) rotate(360deg)`, opacity: 0 }
			], {
				duration: animationDuration * 1000,
				easing: 'linear'
			});

			// Remove the coin after animation completes
			setTimeout(() => {
				if (newCoin.parentNode) {
					newCoin.remove();
				}
			}, animationDuration * 1000);
		}, 800); // Add a new coin every 800ms

		// Cleanup function
		return () => {
			clearInterval(addCoinsInterval);
			if (container.parentNode) {
				container.remove();
			}
		};
	}, []);

	return null; // This component doesn't render anything visible
};
