'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { ArrowLeft, Activity, Shield, TrendingUp, DollarSign, Zap, X, AlertTriangle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useWeb3 } from "@/hooks/useWeb3";
import { useHeliosPosition } from "@/hooks/contracts/useHeliosPosition";
import { toast } from "sonner";

export default function PositionDetailPage() {
  const params = useParams();
  const [currentPrice, setCurrentPrice] = useState([100]);
  const [withdrawPercent, setWithdrawPercent] = useState([5]);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  const { isConnected, address } = useWeb3();
  const { rebalancePosition, closePosition } = useHeliosPosition();
  
  // Mock position data
  const position = {
    id: params.id as string,
    collateral: 0.7,
    debt: 33000,
    buffer: 3000,
    healthFactor: 2.85,
    ltv: 47,
    lpBtc: 0.141,
    lpUsdc: 14142,
    k: 2.1e9,
    equity: 72000,
    trackingError: 2.5,
    threshold: 10,
    status: currentPrice[0] > 110 ? "needs_rebalance" : "healthy",
  };

  // Price simulation
  const priceInDollars = currentPrice[0] * 1000; // $100k base
  const lpBtcAtPrice = Math.sqrt(position.k / priceInDollars);
  const lpUsdcAtPrice = Math.sqrt(position.k * priceInDollars);
  const targetDebt = lpUsdcAtPrice + position.buffer;
  const deltaDebt = targetDebt - position.debt;
  const needsRebalance = Math.abs(deltaDebt) > position.debt * (position.threshold / 100);

  const handleRebalance = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsRebalancing(true);
    try {
      await rebalancePosition({
        currentPrice: priceInDollars,
        targetDebt: deltaDebt.toString(),
        lpWithdrawPercent: deltaDebt < 0 ? withdrawPercent[0] : undefined,
      });
      toast.success('Position rebalanced successfully!');
    } catch (error) {
      console.error('Failed to rebalance:', error);
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleClosePosition = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!confirm('Are you sure you want to close this position? This action cannot be undone.')) {
      return;
    }

    setIsClosing(true);
    try {
      await closePosition();
      toast.success('Position closed successfully!');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Failed to close position:', error);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Position #{params.id}</h1>
            <p className="text-muted-foreground">Manage and monitor your position</p>
          </div>
          <Badge variant={needsRebalance ? "warning" : "default"} className="gap-1">
            {needsRebalance ? <Zap className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
            {needsRebalance ? "Needs Rebalance" : "Healthy"}
          </Badge>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid gap-6 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price vs Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-24">
              <div className="relative h-full">
                <div className="absolute inset-0 border-l border-b border-muted-foreground/20">
                  <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-primary/10 border-t border-dashed border-primary">
                    <span className="absolute -top-5 right-2 text-xs text-muted-foreground">BTC Hold</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-green-500/10 border-t-2 border-green-500">
                    <span className="absolute -top-5 left-2 text-xs font-semibold">Position</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Tracking: {position.trackingError.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              LTV / Health Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>LTV</span>
                  <span className="font-semibold">{position.ltv}%</span>
                </div>
                <Progress value={position.ltv} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm">
                  <span>Health</span>
                  <span className={`font-semibold ${position.healthFactor > 1.5 ? 'text-green-500' : 'text-orange-500'}`}>
                    {position.healthFactor.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Buffer Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-2xl font-bold">${(position.buffer / 1000).toFixed(1)}k</div>
              <Progress value={75} className="h-2" />
              <p className="text-xs text-muted-foreground">75% available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">LP Composition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">BTC</span>
                <span className="font-semibold">{lpBtcAtPrice.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USDC</span>
                <span className="font-semibold">${(lpUsdcAtPrice / 1000).toFixed(1)}k</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-muted-foreground">k</span>
                <span className="font-semibold">{(position.k / 1e9).toFixed(2)}B</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Simulator */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Price Simulator</CardTitle>
          <CardDescription>Test position behavior at different price levels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="price">BTC Price</Label>
              <span className="text-2xl font-bold">${priceInDollars.toLocaleString()}</span>
            </div>
            <Slider
              id="price"
              value={currentPrice}
              onValueChange={setCurrentPrice}
              min={50}
              max={150}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>$50,000</span>
              <span>$100,000</span>
              <span>$150,000</span>
            </div>
          </div>

          {needsRebalance && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Rebalance Required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Price deviation of {((currentPrice[0] - 100) / 100 * 100).toFixed(0)}% exceeds {position.threshold}% threshold
                  </p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Target Debt</span>
                      <span className="font-semibold">${(targetDebt / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Current Debt</span>
                      <span>${(position.debt / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Action Required</span>
                      <span className={deltaDebt > 0 ? "text-orange-500" : "text-blue-500"}>
                        {deltaDebt > 0 ? "Borrow" : "Repay"} ${Math.abs(deltaDebt / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Controls */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Execute position operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-2" 
              variant={needsRebalance ? "default" : "outline"}
              disabled={!needsRebalance || !isConnected || isRebalancing}
              onClick={handleRebalance}
            >
              <RefreshCw className="h-4 w-4" />
              {isRebalancing ? 'Rebalancing...' : 'Rebalance Position'}
              {needsRebalance && !isRebalancing && (
                <Badge variant="warning" className="ml-auto">
                  {deltaDebt > 0 ? "Borrow" : "Repay"}
                </Badge>
              )}
            </Button>
            
            <div className="space-y-2">
              <Label htmlFor="withdraw">Withdraw for Repay: {withdrawPercent[0]}%</Label>
              <Slider
                id="withdraw"
                value={withdrawPercent}
                onValueChange={setWithdrawPercent}
                min={1}
                max={50}
                step={1}
              />
              <Button variant="outline" className="w-full">
                Withdraw {withdrawPercent[0]}% LP (≈ ${(position.lpUsdc * withdrawPercent[0] / 100 / 1000).toFixed(1)}k)
              </Button>
            </div>

            <Button variant="outline" className="w-full justify-start gap-2">
              <TrendingUp className="h-4 w-4" />
              Borrow More USDC
            </Button>

            <Button 
              variant="destructive" 
              className="w-full justify-start gap-2"
              disabled={!isConnected || isClosing}
              onClick={handleClosePosition}
            >
              <X className="h-4 w-4" />
              {isClosing ? 'Closing...' : 'Close Position'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Queue</CardTitle>
            <CardDescription>Recent and pending operations</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="pending" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
              <TabsContent value="pending" className="space-y-2">
                <p className="text-sm text-muted-foreground text-center py-4">No pending transactions</p>
              </TabsContent>
              <TabsContent value="history" className="space-y-2">
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Position Opened</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">Rebalanced</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                    <Badge variant="secondary">Complete</Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium">
      {children}
    </label>
  );
}