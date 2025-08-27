'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStrategyStatus } from '@/hooks/useStrategyStatus';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Shield, 
  AlertCircle,
  Activity,
  Coins,
  RefreshCw
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function StrategyStatusCard() {
  const { metrics, isLoading, rebalanceThreshold } = useStrategyStatus();

  if (isLoading || !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strategy Status</CardTitle>
          <CardDescription>Loading strategy metrics...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const priceChangeColor = metrics.priceChangePercent >= 0 ? 'text-green-600' : 'text-red-600';
  const PriceIcon = metrics.priceChangePercent >= 0 ? TrendingUp : TrendingDown;
  
  const healthColor = metrics.healthFactor >= 1.5 ? 'text-green-600' : 
                      metrics.healthFactor >= 1.2 ? 'text-yellow-600' : 'text-red-600';
  
  const ltvColor = metrics.currentLTV <= metrics.targetLTV ? 'text-green-600' :
                   metrics.currentLTV <= metrics.maxLTV * 0.9 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">IL Protection Strategy</CardTitle>
            <CardDescription>Real-time position metrics and health status</CardDescription>
          </div>
          <Badge variant={metrics.strategyActive ? "default" : "secondary"}>
            {metrics.strategyActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            Price Metrics
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Current BTC Price</p>
              <p className="text-2xl font-bold">${parseFloat(metrics.currentBtcPrice).toLocaleString()}</p>
              <div className={`flex items-center gap-1 ${priceChangeColor}`}>
                <PriceIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {metrics.priceChangePercent >= 0 ? '+' : ''}{metrics.priceChangePercent.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Last Rebalance Price</p>
              <p className="text-2xl font-bold">${parseFloat(metrics.lastRebalancePrice).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">
                Initial: ${parseFloat(metrics.initialBtcPrice).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Position Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Coins className="h-4 w-4" />
            Position Details
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">BTC Deposited</p>
              <p className="text-lg font-semibold">{parseFloat(metrics.totalBtcDeposited).toFixed(4)} BTC</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">USDT Borrowed</p>
              <p className="text-lg font-semibold">{parseFloat(metrics.totalUsdtBorrowed).toFixed(2)} USDT</p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">LP Tokens</p>
              <p className="text-lg font-semibold">{parseFloat(metrics.lpTokenBalance).toFixed(6)}</p>
            </div>
          </div>
          
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Position Value</span>
              <span className="text-lg font-bold">${parseFloat(metrics.totalValue).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Health Metrics Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Shield className="h-4 w-4" />
            Health Metrics
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health Factor</span>
                <span className={`text-lg font-semibold ${healthColor}`}>
                  {metrics.healthFactor >= 999 ? '∞' : metrics.healthFactor.toFixed(2)}
                </span>
              </div>
              <Progress 
                value={metrics.healthFactor >= 999 ? 100 : Math.min(metrics.healthFactor * 33.33, 100)} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current LTV</span>
                <span className={`text-lg font-semibold ${ltvColor}`}>
                  {metrics.currentLTV.toFixed(1)}%
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={(metrics.currentLTV / metrics.maxLTV) * 100} 
                  className="h-2"
                />
                <div 
                  className="absolute top-0 h-2 w-0.5 bg-yellow-500"
                  style={{ left: `${(metrics.targetLTV / metrics.maxLTV) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>Target: {metrics.targetLTV}%</span>
                <span>Max: {metrics.maxLTV}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rebalance Alert */}
        {metrics.needsRebalance && (
          <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Rebalance Required
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400">
                Price deviation exceeds {rebalanceThreshold}% threshold
              </p>
            </div>
            <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-500 animate-pulse" />
          </div>
        )}

        {/* Status Indicator */}
        {!metrics.needsRebalance && metrics.strategyActive && (
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Strategy Healthy
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                All parameters within optimal range
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}