'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWeb3 } from '@/hooks/useWeb3';
import { Wallet, ChevronDown } from 'lucide-react';
import { xverseConnector } from '@midl-xyz/midl-js-connectors';
import { useAddNetwork, useConfig } from '@midl-xyz/midl-js-react';
import { ConnectButton } from '@midl-xyz/satoshi-kit';

interface WalletConnectButtonProps {
  openConnectDialog?: () => void;
  openAccountDialog?: () => void;
  isConnected?: boolean;
  isConnecting?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  className?: string;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  openConnectDialog,
  openAccountDialog,
  isConnected: propIsConnected,
  isConnecting: propIsConnecting,
  onConnect,
  onDisconnect,
  className
}) => {
  const { address, isConnected: hookIsConnected, isConnecting: hookIsConnecting, currentChain, connectWallet, disconnectWallet } = useWeb3();

  // Use props from ConnectButton if available, otherwise fall back to hook values
  const isConnected = propIsConnected !== undefined ? propIsConnected : hookIsConnected;
  const isConnecting = propIsConnecting !== undefined ? propIsConnecting : hookIsConnecting;

  const handleClick = async () => {
    if (openConnectDialog && openAccountDialog) {
      // Use the MIDL ConnectButton's functions
      if (isConnected) {
        openAccountDialog();
        onDisconnect?.();
      } else {
        openConnectDialog();
        onConnect?.();
      }
    } else {
      // Fallback to Web3 hook
      if (isConnected) {
        disconnectWallet();
        onDisconnect?.();
      } else {
        try {
          await connectWallet();
          onConnect?.();
        } catch (error) {
          console.error('Connection failed:', error);
        }
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="px-3 py-1 transition-all duration-200 hover:bg-secondary/80">
          {currentChain?.name || 'Unknown'}
        </Badge>
        <Button
          variant="outline" 
          className={`gap-2 transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/50 hover:scale-105 active:scale-95 ${className}`}
          onClick={handleClick}
        >
          <Wallet className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
          {formatAddress(address)}
          <ChevronDown className="h-3 w-3 transition-transform duration-200 hover:rotate-180" />
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleClick}
      disabled={isConnecting}
      className={`gap-2 transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:hover:shadow-none ${className}`}
    >
      <Wallet className={`h-4 w-4 transition-transform duration-200 ${!isConnecting ? 'hover:rotate-12' : 'animate-pulse'}`} />
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

// Create a wrapper component that uses the MIDL ConnectButton like in AppSidebar
export const MIDLWalletConnectButton: React.FC<{ className?: string }> = ({ className }) => {
  const { addNetworkAsync } = useAddNetwork();
  const { network } = useConfig();

  return (
    <div className={`font-primary h-11 w-full ${className}`}>
      <ConnectButton
        hideAvatar
        hideBalance
        beforeConnect={async (connectorId) => {
          if (connectorId !== xverseConnector().id) {
            return;
          }

          await addNetworkAsync({
            connectorId,
            networkConfig: {
              name: 'MIDL Regtest',
              network: network.id,
              rpcUrl: 'https://mempool.regtest.midl.xyz/api',
              indexerUrl: 'https://api-regtest-midl.xverse.app'
            }
          });
        }}
        children={({ openConnectDialog, openAccountDialog, isConnected, isConnecting }) => (
          <WalletConnectButton
            openConnectDialog={openConnectDialog}
            openAccountDialog={openAccountDialog}
            isConnected={isConnected}
            isConnecting={isConnecting}
          />
        )}
      />
    </div>
  );
};

export default WalletConnectButton;