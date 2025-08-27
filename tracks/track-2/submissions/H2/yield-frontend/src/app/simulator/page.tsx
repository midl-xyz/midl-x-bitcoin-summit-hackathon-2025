'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Calculator, TrendingUp, DollarSign, Activity, Percent, Shield, AlertTriangle, CheckCircle } from "lucide-react";

export default function SimulatorPage() {
  const [borrowApr, setBorrowApr] = useState<number[]>([5.2]);
  const [lpApr, setLpApr] = useState<number[]>([12.5]);
  const [threshold, setThreshold] = useState<number[]>([10]);
  const [bufferSize, setBufferSize] = useState<number[]>([3000]);
  const [lpFee, setLpFee] = useState<number[]>([0.3]);
  const [btcPrice, setBtcPrice] = useState<number[]>([100]);
  const [collateral, setCollateral] = useState<number[]>([0.7]);
  const [priceChange, setPriceChange] = useState<number[]>([0]);

  // Calculate IL for traditional LP vs our strategy
  const priceRatio = (btcPrice[0] + priceChange[0]) / btcPrice[0];
  
  // Traditional IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
  const traditionalIL = priceRatio > 0 ? 
    Math.abs((2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1) * 100) : 0;
  
  // Our strategy IL (reduced by dynamic rebalancing)
  const rebalanceEfficiency = Math.min(95, 100 - threshold[0]); // Lower threshold = better IL protection
  const heliosIL = traditionalIL * (1 - rebalanceEfficiency / 100);
  const ilReduction = traditionalIL - heliosIL;
  const ilReductionPercent = traditionalIL > 0 ? (ilReduction / traditionalIL * 100) : 0;

  // Calculate other metrics
  const netApr = lpApr[0] - borrowApr[0];
  const yearlyReturn = (collateral[0] * btcPrice[0] * 1000 * netApr) / 100;
  const totalFees = (collateral[0] * btcPrice[0] * 1000 * lpFee[0]) / 100;
  
  // Adjusted returns considering IL protection
  const traditionalReturn = yearlyReturn - (traditionalIL * collateral[0] * btcPrice[0] * 10);
  const heliosReturn = yearlyReturn - (heliosIL * collateral[0] * btcPrice[0] * 10);
  const additionalReturn = heliosReturn - traditionalReturn;
  
  // Risk metrics
  const liquidationPrice = btcPrice[0] * 0.65;
  const bufferDays = bufferSize[0] / ((borrowApr[0] * collateral[0] * btcPrice[0] * 10) / 365);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Impermanent Loss Protection Simulator
        </h1>
        <p className="text-muted-foreground">See how Helios Yield protects your position from impermanent loss through dynamic rebalancing</p>
      </div>

      {/* Hero IL Comparison Card */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl">Impermanent Loss Comparison</CardTitle>
          <CardDescription>Real-time comparison between Traditional LP and Helios Strategy</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Traditional LP</p>
              <p className="text-3xl font-bold text-red-500">-{traditionalIL.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">Unprotected IL</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Helios Strategy</p>
              <p className="text-3xl font-bold text-green-500">-{heliosIL.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground">Protected with rebalancing</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">IL Reduction</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-primary">{ilReductionPercent.toFixed(0)}%</p>
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  SAVED
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Protection efficiency</p>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <Label htmlFor="price-change">Price Change Simulation: {priceChange[0] > 0 ? '+' : ''}{priceChange[0].toFixed(0)}%</Label>
            <Slider
              id="price-change"
              value={priceChange}
              onValueChange={setPriceChange}
              min={-90}
              max={200}
              step={1}
              className="py-4"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-90%</span>
              <span>-50%</span>
              <span>0%</span>
              <span>+100%</span>
              <span>+200%</span>
            </div>
          </div>

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-2">💡 How it works:</p>
            <p className="text-xs text-muted-foreground">
              When BTC price moves {Math.abs(priceChange[0])}%, traditional LPs lose {traditionalIL.toFixed(2)}% to IL. 
              Helios reduces this to just {heliosIL.toFixed(2)}% through automatic rebalancing, 
              saving you ${(ilReduction * collateral[0] * btcPrice[0] * 10).toFixed(0)} on a ${(collateral[0] * btcPrice[0] * 1000).toFixed(0)} position.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Parameter Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Parameters</CardTitle>
              <CardDescription>Adjust rates and fees</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="borrow-apr">Aave Borrow APR: {borrowApr[0].toFixed(1)}%</Label>
                  <Slider
                    id="borrow-apr"
                    value={borrowApr}
                    onValueChange={setBorrowApr}
                    min={0}
                    max={20}
                    step={0.1}
                    className="py-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lp-apr">Uniswap LP APR: {lpApr[0].toFixed(1)}%</Label>
                  <Slider
                    id="lp-apr"
                    value={lpApr}
                    onValueChange={setLpApr}
                    min={0}
                    max={50}
                    step={0.5}
                    className="py-4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lp-fee">LP Fee Tier: {lpFee[0].toFixed(2)}%</Label>
                <Slider
                  id="lp-fee"
                  value={lpFee}
                  onValueChange={setLpFee}
                  min={0.01}
                  max={1}
                  step={0.01}
                  className="py-4"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Parameters</CardTitle>
              <CardDescription>Configure thresholds and safety buffers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="threshold">Rebalance Threshold: {threshold[0].toFixed(0)}%</Label>
                  <Slider
                    id="threshold"
                    value={threshold}
                    onValueChange={setThreshold}
                    min={1}
                    max={20}
                    step={1}
                    className="py-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buffer">Buffer Size: ${(bufferSize[0] / 1000).toFixed(1)}k</Label>
                  <Slider
                    id="buffer"
                    value={bufferSize}
                    onValueChange={setBufferSize}
                    min={500}
                    max={10000}
                    step={500}
                    className="py-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Position Setup</CardTitle>
              <CardDescription>Initial position parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">BTC Price: ${btcPrice[0]}k</Label>
                  <Slider
                    id="price"
                    value={btcPrice}
                    onValueChange={setBtcPrice}
                    min={50}
                    max={150}
                    step={5}
                    className="py-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collateral">Collateral: {collateral[0].toFixed(2)} BTC</Label>
                  <Slider
                    id="collateral"
                    value={collateral}
                    onValueChange={setCollateral}
                    min={0.1}
                    max={2}
                    step={0.1}
                    className="py-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <Card className="border-green-500/20 bg-gradient-to-br from-green-500/5 to-green-500/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                IL Protection Benefits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-muted-foreground">IL Protection Level</span>
                    <span className="text-sm font-bold text-primary">{ilReductionPercent.toFixed(0)}%</span>
                  </div>
                  <Progress value={ilReductionPercent} className="h-2" />
                </div>
                
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Comparative Returns (1 Year)</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Traditional LP</span>
                      <span className="text-sm font-semibold text-orange-500">
                        ${(traditionalReturn / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Helios Strategy</span>
                      <span className="text-sm font-semibold text-green-500">
                        ${(heliosReturn / 1000).toFixed(1)}k
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-semibold">Additional Profit</span>
                      <span className="text-lg font-bold text-primary">
                        +${(additionalReturn / 1000).toFixed(1)}k
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Protection Mechanism
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rebalance Threshold</span>
                  <span className="font-semibold">{threshold[0]}%</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {threshold[0] < 5 ? '🟢 Aggressive protection' : 
                   threshold[0] < 10 ? '🟡 Balanced protection' : 
                   '🔴 Conservative protection'}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Rebalance Frequency</span>
                  <span className="font-semibold">
                    {threshold[0] < 5 ? 'Daily' : threshold[0] < 10 ? 'Weekly' : 'Monthly'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  More frequent = Better IL protection
                </div>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Protection Cost</span>
                  <span className="font-semibold text-orange-500">
                    ~${(threshold[0] < 5 ? 50 : threshold[0] < 10 ? 20 : 10)} /mo
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Gas fees for rebalancing
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>IL Protection Scenarios</CardTitle>
              <CardDescription>Protection at different price levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
                  <div>Price</div>
                  <div className="text-center">Trad. IL</div>
                  <div className="text-center">Helios IL</div>
                  <div className="text-center">Saved</div>
                </div>
                {[25, 50, 100, 200].map(change => {
                  const ratio = (100 + change) / 100;
                  const tradIL = Math.abs((2 * Math.sqrt(ratio) / (1 + ratio) - 1) * 100);
                  const helIL = tradIL * (1 - rebalanceEfficiency / 100);
                  return (
                    <div key={change} className="grid grid-cols-4 gap-2 text-xs">
                      <div>+{change}%</div>
                      <div className="text-center text-red-500">-{tradIL.toFixed(1)}%</div>
                      <div className="text-center text-green-500">-{helIL.toFixed(1)}%</div>
                      <div className="text-center font-bold text-primary">
                        {((tradIL - helIL) / tradIL * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
                {[25, 50, 75, 90].map(change => {
                  const ratio = (100 - change) / 100;
                  const tradIL = Math.abs((2 * Math.sqrt(ratio) / (1 + ratio) - 1) * 100);
                  const helIL = tradIL * (1 - rebalanceEfficiency / 100);
                  return (
                    <div key={-change} className="grid grid-cols-4 gap-2 text-xs">
                      <div>-{change}%</div>
                      <div className="text-center text-red-500">-{tradIL.toFixed(1)}%</div>
                      <div className="text-center text-green-500">-{helIL.toFixed(1)}%</div>
                      <div className="text-center font-bold text-primary">
                        {((tradIL - helIL) / tradIL * 100).toFixed(0)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Protection Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="text-5xl font-bold mb-2 text-primary">
                  {ilReductionPercent.toFixed(0)}%
                </div>
                <p className="text-sm font-semibold mb-1">
                  Impermanent Loss Reduction
                </p>
                <p className="text-xs text-muted-foreground">
                  Save up to ${(ilReduction * collateral[0] * btcPrice[0] * 10).toFixed(0)} annually
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {ilReductionPercent > 80 ? 
                    <Badge variant="default">Excellent Protection</Badge> :
                   ilReductionPercent > 60 ? 
                    <Badge variant="default">Good Protection</Badge> :
                    <Badge variant="secondary">Basic Protection</Badge>
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}