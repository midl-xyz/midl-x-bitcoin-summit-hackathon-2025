'use client';

import { useAccount, useConnect, useDisconnect, useChainId, useConnectors } from 'wagmi';
import { supportedChains, type ChainId } from '@/config/wagmiConfig';

export const useWeb3 = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId() as ChainId;
  const connectors = useConnectors();

  const currentChain = Object.values(supportedChains).find(
    chain => chain.id === chainId
  );

  const connectWallet = async (connectorId?: string) => {
    if (connectors.length > 0) {
      const connector = connectorId 
        ? connectors.find(c => c.id === connectorId) 
        : connectors[0];
      
      if (connector) {
        try {
          connect({ connector });
        } catch (error) {
          console.error('Failed to connect wallet:', error);
          throw error;
        }
      }
    }
  };

  const disconnectWallet = () => {
    disconnect();
  };

  return {
    // Account info
    address,
    isConnected,
    isConnecting,
    
    // Chain info
    chainId,
    currentChain,
    
    // Connection actions
    connectWallet,
    disconnectWallet,
    
    // Available connectors
    connectors,
  };
};