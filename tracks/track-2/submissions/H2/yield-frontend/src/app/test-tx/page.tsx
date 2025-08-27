'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IntentionSigner } from '@/components/shared/IntentionSigner';
import { StrategyStatusCard } from '@/components/StrategyStatusCard';
import { RebalanceIndicator } from '@/components/RebalanceIndicator';
import { useYieldActions } from '@/hooks/useYieldActions';
import { parseUnits } from 'viem';
import { Shield, RefreshCw, Activity } from 'lucide-react';

export default function TestTransactionPage() {
  const { 
    isModalOpen, 
    setIsModalOpen, 
    initializeILProtection,
    rebalance 
  } = useYieldActions();

  // IL Protection form state
  const [btcAmount, setBtcAmount] = useState('');
  const [usdtAmount, setUsdtAmount] = useState('');

  const handleInitializeIL = () => {
    if (!btcAmount || !usdtAmount) return;
    
    const btc = parseUnits(btcAmount, 18);
    const usdt = parseUnits(usdtAmount, 6);
    initializeILProtection.mutate({ btcAmount: btc, usdtAmount: usdt });
  };

  const handleRebalance = () => {
    rebalance.mutate();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Helios IL Protection Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your impermanent loss protection strategy and monitor positions
        </p>
      </div>

      {/* Strategy Status Section */}
      <div className="grid gap-6 mb-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StrategyStatusCard />
        </div>
        <div className="space-y-4">
          <RebalanceIndicator />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Quick Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RebalanceIndicator compact />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="ilprotection" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ilprotection">IL Protection</TabsTrigger>
          <TabsTrigger value="rebalance">Rebalance</TabsTrigger>
        </TabsList>

        <TabsContent value="ilprotection">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Initialize IL Protection
              </CardTitle>
              <CardDescription>
                Set up impermanent loss protection for your LP position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="btc-amount">BTC Amount</Label>
                <Input
                  id="btc-amount"
                  type="number"
                  placeholder="0.00 BTC"
                  value={btcAmount}
                  onChange={(e) => setBtcAmount(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="usdt-amount">USDT Amount</Label>
                <Input
                  id="usdt-amount"
                  type="number"
                  placeholder="0.00 USDT"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  className="mt-2"
                />
              </div>

              <Button 
                onClick={handleInitializeIL} 
                disabled={!btcAmount || !usdtAmount || initializeILProtection.isPending}
                className="w-full"
              >
                {initializeILProtection.isPending ? 'Processing...' : 'Initialize Strategy'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rebalance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Manual Rebalance
              </CardTitle>
              <CardDescription>
                Manually trigger a rebalance of your IL protection strategy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RebalanceIndicator />

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Rebalancing Info</p>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Rebalances when price deviates beyond threshold</li>
                  <li>• Adjusts hedge position to maintain protection</li>
                  <li>• Manages LTV to prevent liquidation</li>
                  <li>• Optimizes for minimal impermanent loss</li>
                </ul>
              </div>

              <Button 
                onClick={handleRebalance}
                disabled={rebalance.isPending}
                className="w-full"
                variant="default"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${rebalance.isPending ? 'animate-spin' : ''}`} />
                {rebalance.isPending ? 'Processing Rebalance...' : 'Force Rebalance'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* IntentionSigner Modal */}
      <IntentionSigner 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}