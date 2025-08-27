import type { HardhatRuntimeEnvironment } from "hardhat/types";

export default async function deploy(hre: HardhatRuntimeEnvironment) {
	/**
	 * Initializes MIDL hardhat deploy SDK
	 */
	await hre.midl.initialize();

	/**
	 * Add the deploy contract transaction intention
	 */
	await hre.midl.deploy("Vault");

	/**
	 * Sends the BTC transaction and EVM transaction to the network
	 */
	await hre.midl.execute();
}
