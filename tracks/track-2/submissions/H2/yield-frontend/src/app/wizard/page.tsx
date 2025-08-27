'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ArrowRight, Calculator, DollarSign, Percent, Shield } from "lucide-react";
import Link from "next/link";
import { useWeb3 } from "@/hooks/useWeb3";
import { useHeliosPosition } from "@/hooks/contracts/useHeliosPosition";
import { toast } from "sonner";

export default function WizardPage() {
  const [network, setNetwork] = useState('sepolia');
  const [collateral, setCollateral] = useState('0.7');
  const [targetLtv, setTargetLtv] = useState([50]);
  const [bufferUsdc, setBufferUsdc] = useState('3000');
  const [rebalanceThreshold, setRebalanceThreshold] = useState('10');
  const [slippage, setSlippage] = useState([0.5]);
  const [isCreating, setIsCreating] = useState(false);

  const { isConnected, address } = useWeb3();
  const { openPosition } = useHeliosPosition();

  // Simulation values
  const initialPrice = 100000; // $100k BTC
  const lpBtcAmount = parseFloat(collateral) * 0.3; // Example calculation
  const lpUsdcAmount = lpBtcAmount * initialPrice;
  const k = lpBtcAmount * lpUsdcAmount;
  const initialDebt = lpUsdcAmount + parseFloat(bufferUsdc);

  const handleCreatePosition = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsCreating(true);
    try {
      await openPosition({
        collateralBtc: collateral,
        bufferUsdc: bufferUsdc,
        targetLtv: targetLtv[0],
        rebalanceThreshold: parseInt(rebalanceThreshold),
      });
      
      // Redirect to dashboard after successful creation
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to create position:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Create New Position</h1>
        <p className="text-muted-foreground">Configure your Aave + Uniswap LP yield position</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Configuration Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Network & Assets</CardTitle>
              <CardDescription>Choose network and configure collateral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="network">Network</Label>
                <Select value={network} onValueChange={setNetwork}>
                  <SelectTrigger id="network">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sepolia">Sepolia Testnet</SelectItem>
                    <SelectItem value="mainnet">Ethereum Mainnet</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="collateral">BTC Collateral Amount</Label>
                <Input
                  id="collateral"
                  type="number"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  placeholder="0.0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">Amount of BTC to supply as collateral</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ltv">Target LTV: {targetLtv[0]}%</Label>
                <Slider
                  id="ltv"
                  value={targetLtv}
                  onValueChange={setTargetLtv}
                  min={30}
                  max={70}
                  step={5}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">Loan-to-Value ratio to maintain</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Parameters</CardTitle>
              <CardDescription>Configure buffer and rebalancing thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buffer">Buffer USDC Amount</Label>
                <Input
                  id="buffer"
                  type="number"
                  value={bufferUsdc}
                  onChange={(e) => setBufferUsdc(e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">USDC buffer for rebalancing operations</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Rebalance Threshold</Label>
                <Select value={rebalanceThreshold} onValueChange={setRebalanceThreshold}>
                  <SelectTrigger id="threshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1% (Aggressive)</SelectItem>
                    <SelectItem value="5">5% (Balanced)</SelectItem>
                    <SelectItem value="10">10% (Conservative)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Price deviation trigger for rebalancing</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slippage">Slippage Tolerance: {slippage[0]}%</Label>
                <Slider
                  id="slippage"
                  value={slippage}
                  onValueChange={setSlippage}
                  min={0.1}
                  max={3}
                  step={0.1}
                  className="py-4"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>LP Configuration</CardTitle>
              <CardDescription>Uniswap V3 liquidity provision settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pair">LP Pair</Label>
                <Select defaultValue="wbtc-usdc">
                  <SelectTrigger id="pair">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wbtc-usdc">WBTC/USDC</SelectItem>
                    <SelectItem value="wbtc-usdt">WBTC/USDT</SelectItem>
                    <SelectItem value="wbtc-dai">WBTC/DAI</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee">Fee Tier</Label>
                <Select defaultValue="0.05">
                  <SelectTrigger id="fee">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">0.01%</SelectItem>
                    <SelectItem value="0.05">0.05%</SelectItem>
                    <SelectItem value="0.3">0.30%</SelectItem>
                    <SelectItem value="1">1.00%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Real-time Simulation */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Position Preview
              </CardTitle>
              <CardDescription>Simulated position at current price</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Initial Price</p>
                    <p className="text-2xl font-bold">${(initialPrice / 1000).toFixed(0)}k</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LP Constant (k)</p>
                    <p className="text-2xl font-bold">{(k / 1e9).toFixed(2)}B</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LP BTC Amount</p>
                    <p className="text-xl font-semibold">{lpBtcAmount.toFixed(3)} BTC</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">LP USDC Amount</p>
                    <p className="text-xl font-semibold">${(lpUsdcAmount / 1000).toFixed(0)}k</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Initial Debt (D₀)</p>
                    <p className="text-2xl font-bold text-orange-500">
                      ${(initialDebt / 1000).toFixed(1)}k
                    </p>
                    <p className="text-xs text-muted-foreground">
                      = LP USDC ({(lpUsdcAmount / 1000).toFixed(0)}k) + Buffer ({(parseFloat(bufferUsdc) / 1000).toFixed(0)}k)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>APR Projections</CardTitle>
              <CardDescription>Expected returns based on current rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="1month" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="1month">1 Month</TabsTrigger>
                  <TabsTrigger value="6months">6 Months</TabsTrigger>
                  <TabsTrigger value="1year">1 Year</TabsTrigger>
                </TabsList>
                <TabsContent value="1month" className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Aave Borrow APR</span>
                    <span className="font-semibold text-red-500">-5.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Uniswap LP APR</span>
                    <span className="font-semibold text-green-500">+12.5%</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="text-sm font-semibold">Net APR</span>
                    <span className="font-bold text-green-500">+7.3%</span>
                  </div>
                </TabsContent>
                <TabsContent value="6months" className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Return</span>
                    <span className="font-bold text-green-500">+$4,200</span>
                  </div>
                </TabsContent>
                <TabsContent value="1year" className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Return</span>
                    <span className="font-bold text-green-500">+$8,760</span>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Risk Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Health Factor</span>
                <span className="font-semibold text-green-500">2.85</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Liquidation Price</span>
                <span className="font-semibold">$65,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Max Drawdown</span>
                <span className="font-semibold text-orange-500">-35%</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button 
              className="flex-1 gap-2" 
              onClick={handleCreatePosition}
              disabled={!isConnected || isCreating}
            >
              {!isConnected ? 'Connect Wallet First' : isCreating ? 'Creating...' : 'Open Position'}
              {!isCreating && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}