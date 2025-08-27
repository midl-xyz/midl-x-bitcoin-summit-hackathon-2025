'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Plus, TrendingUp, TrendingDown, AlertCircle, DollarSign, Activity, Shield, Zap } from "lucide-react";
import { useState } from "react";
import type { Position, PositionMetrics, PositionStatus } from "@/types/position";

// Mock data for demo
const mockPositions: (Position & PositionMetrics)[] = [
  {
    id: "1",
    network: "sepolia",
    p0: 100000000000n, // $100k
    collateralBtc: 700000000000000000n, // 0.7 BTC
    debtUsdc: 33000000000n, // $33k
    bufferUsdc: 3000000000n, // $3k
    lpK: 21000000000000000000n,
    lpSharePct: 15,
    thresholdBps: 1000, // 10%
    aprBorrowBps: 520, // 5.2%
    aprLpBps: 1250, // 12.5%
    spotBtc: 0n,
    feesAccrued: 125000000n,
    interestAccrued: 52000000n,
    txCostsAccrued: 15000000n,
    lastRebalanceTs: Date.now() - 3600000,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    healthFactor: 2.85,
    ltv: 47,
    currentPrice: 105000000000n,
    equity: 72000000000n,
    trackingError: 2.5,
    lpBtcAmount: 141421356n,
    lpUsdcAmount: 14142135623n,
    status: "healthy"
  },
  {
    id: "2",
    network: "sepolia",
    p0: 98000000000n,
    collateralBtc: 500000000000000000n,
    debtUsdc: 25000000000n,
    bufferUsdc: 1000000000n,
    lpK: 15000000000000000000n,
    lpSharePct: 12,
    thresholdBps: 500,
    aprBorrowBps: 520,
    aprLpBps: 1100,
    spotBtc: 50000000000000000n,
    feesAccrued: 95000000n,
    interestAccrued: 45000000n,
    txCostsAccrued: 12000000n,
    lastRebalanceTs: Date.now() - 7200000,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
    healthFactor: 1.95,
    ltv: 62,
    currentPrice: 95000000000n,
    equity: 45000000000n,
    trackingError: 8.5,
    lpBtcAmount: 125892541n,
    lpUsdcAmount: 11952286093n,
    status: "needs_rebalance"
  },
  {
    id: "3",
    network: "sepolia",
    p0: 102000000000n,
    collateralBtc: 1000000000000000000n,
    debtUsdc: 48000000000n,
    bufferUsdc: 500000000n,
    lpK: 35000000000000000000n,
    lpSharePct: 20,
    thresholdBps: 1000,
    aprBorrowBps: 520,
    aprLpBps: 1350,
    spotBtc: 0n,
    feesAccrued: 180000000n,
    interestAccrued: 85000000n,
    txCostsAccrued: 25000000n,
    lastRebalanceTs: Date.now() - 1800000,
    createdAt: Date.now() - 604800000,
    updatedAt: Date.now() - 1800000,
    healthFactor: 1.45,
    ltv: 72,
    currentPrice: 108000000000n,
    equity: 95000000000n,
    trackingError: 1.2,
    lpBtcAmount: 180277564n,
    lpUsdcAmount: 19470019653n,
    status: "buffer_low"
  }
];

function getStatusBadgeVariant(status: PositionStatus) {
  switch (status) {
    case "healthy":
      return "default";
    case "needs_rebalance":
      return "warning";
    case "buffer_low":
      return "warning";
    case "closeable":
      return "secondary";
    default:
      return "default";
  }
}

function getStatusIcon(status: PositionStatus) {
  switch (status) {
    case "healthy":
      return <Activity className="h-4 w-4" />;
    case "needs_rebalance":
      return <Zap className="h-4 w-4" />;
    case "buffer_low":
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
}

export default function DashboardPage() {
  const [positions] = useState(mockPositions);

  const totalEquity = positions.reduce((acc, p) => acc + Number(p.equity), 0);
  const totalDebt = positions.reduce((acc, p) => acc + Number(p.debtUsdc), 0);
  const totalFees = positions.reduce((acc, p) => acc + Number(p.feesAccrued), 0);
  const avgHealthFactor = positions.reduce((acc, p) => acc + p.healthFactor, 0) / positions.length;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Positions Dashboard</h1>
          <p className="text-muted-foreground">Manage your Aave + Uniswap LP positions</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/wizard">
            <Plus className="h-4 w-4" />
            New Position
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Equity</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalEquity / 1e9).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12.5%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalDebt / 1e9).toFixed(0)}k</div>
            <p className="text-xs text-muted-foreground">
              Average APR: 5.2%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Health Factor</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHealthFactor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Safe zone: &gt;1.5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalFees / 1e6).toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Position Cards */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {positions.map((position) => (
          <Card key={position.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">Position #{position.id}</CardTitle>
                  <CardDescription>{position.network}</CardDescription>
                </div>
                <Badge variant={getStatusBadgeVariant(position.status)} className="gap-1">
                  {getStatusIcon(position.status)}
                  {position.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Health Factor</p>
                  <p className="text-xl font-semibold">{position.healthFactor.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">LTV</p>
                  <p className="text-xl font-semibold">{position.ltv}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Debt</span>
                  <span className="font-medium">${(Number(position.debtUsdc) / 1e9).toFixed(0)}k</span>
                </div>
                <Progress value={position.ltv} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Buffer</p>
                  <p className="font-medium">${(Number(position.bufferUsdc) / 1e9).toFixed(1)}k</p>
                </div>
                <div>
                  <p className="text-muted-foreground">LP Share</p>
                  <p className="font-medium">{position.lpSharePct}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">LP Balance</span>
                  <span className="font-medium">
                    {(Number(position.lpBtcAmount) / 1e8).toFixed(3)} BTC / ${(Number(position.lpUsdcAmount) / 1e9).toFixed(0)}k
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">k constant</span>
                  <span className="font-medium">{(Number(position.lpK) / 1e18).toFixed(1)}B</span>
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tracking Error</span>
                <span className={`font-medium ${position.trackingError > 5 ? 'text-orange-500' : 'text-green-500'}`}>
                  {position.trackingError.toFixed(1)}%
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Fees</p>
                    <p className="font-medium text-green-500">+${(Number(position.feesAccrued) / 1e6).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest</p>
                    <p className="font-medium text-red-500">-${(Number(position.interestAccrued) / 1e6).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tx Costs</p>
                    <p className="font-medium text-orange-500">-${(Number(position.txCostsAccrued) / 1e6).toFixed(0)}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href={`/position/${position.id}`}>View Details</Link>
                </Button>
                {position.status === "needs_rebalance" && (
                  <Button size="sm" className="flex-1">
                    Rebalance
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {positions.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">No positions yet</p>
            <Button asChild>
              <Link href="/wizard">Create Your First Position</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}