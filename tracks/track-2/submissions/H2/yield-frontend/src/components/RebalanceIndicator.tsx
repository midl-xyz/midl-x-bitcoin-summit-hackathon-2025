'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStrategyStatus } from '@/hooks/useStrategyStatus';
import { useYieldActions } from '@/hooks/useYieldActions';
import { 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RebalanceIndicatorProps {
  className?: string;
  compact?: boolean;
}

export function RebalanceIndicator({ className, compact = false }: RebalanceIndicatorProps) {
  const { metrics, isLoading, refetch, rebalanceThreshold } = useStrategyStatus();
  const { rebalance } = useYieldActions();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  if (isLoading || !metrics || !metrics.strategyActive) {
    if (compact) {
      return (
        <Badge variant="secondary" className="gap-1">
          <RefreshCw className="h-3 w-3" />
          Inactive
        </Badge>
      );
    }
    
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full" />
              <span className="text-sm text-muted-foreground">Strategy Inactive</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const priceChange = metrics.lastRebalancePrice ? 
    ((parseFloat(metrics.currentBtcPrice) - parseFloat(metrics.lastRebalancePrice)) / parseFloat(metrics.lastRebalancePrice)) * 100 : 0;
  
  const PriceIcon = priceChange >= 0 ? TrendingUp : TrendingDown;
  const priceChangeColor = priceChange >= 0 ? 'text-green-600' : 'text-red-600';

  // Determine status
  const getStatus = () => {
    if (metrics.needsRebalance) {
      return {
        label: 'Rebalance Needed',
        color: 'bg-yellow-500',
        variant: 'warning' as const,
        icon: AlertTriangle,
        pulse: true
      };
    }
    
    if (Math.abs(priceChange) > rebalanceThreshold * 0.7) {
      return {
        label: 'Approaching Threshold',
        color: 'bg-orange-500',
        variant: 'default' as const,
        icon: Info,
        pulse: false
      };
    }
    
    return {
      label: 'Balanced',
      color: 'bg-green-500',
      variant: 'success' as const,
      icon: CheckCircle,
      pulse: false
    };
  };

  const status = getStatus();

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Badge 
          variant={status.variant === 'success' ? 'default' : status.variant === 'warning' ? 'destructive' : 'secondary'}
          className="gap-1"
        >
          <status.icon className="h-3 w-3" />
          {status.label}
        </Badge>
        {metrics.needsRebalance && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => rebalance.mutate()}
            disabled={rebalance.isPending}
            className="h-7 px-2"
          >
            <RefreshCw className={cn("h-3 w-3", rebalance.isPending && "animate-spin")} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("relative", status.pulse && "animate-pulse")}>
                <div className={cn("h-3 w-3 rounded-full", status.color)} />
                {status.pulse && (
                  <div className={cn("absolute inset-0 h-3 w-3 rounded-full animate-ping", status.color, "opacity-75")} />
                )}
              </div>
              <div>
                <p className="font-semibold">{status.label}</p>
                <p className="text-xs text-muted-foreground">
                  Auto-refresh {autoRefresh ? 'enabled' : 'disabled'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", autoRefresh && "text-primary")} />
            </Button>
          </div>

          {/* Price Change */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <PriceIcon className={cn("h-4 w-4", priceChangeColor)} />
              <span className="text-sm text-muted-foreground">Price change since last rebalance</span>
            </div>
            <span className={cn("font-semibold", priceChangeColor)}>
              {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
            </span>
          </div>

          {/* Threshold Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rebalance Threshold</span>
              <span className="font-medium">{rebalanceThreshold}%</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-500",
                  Math.abs(priceChange) >= rebalanceThreshold ? "bg-yellow-500" :
                  Math.abs(priceChange) >= rebalanceThreshold * 0.7 ? "bg-orange-500" : "bg-green-500"
                )}
                style={{ width: `${Math.min(100, (Math.abs(priceChange) / rebalanceThreshold) * 100)}%` }}
              />
            </div>
          </div>

          {/* Action Button */}
          {metrics.needsRebalance && (
            <Button
              onClick={() => rebalance.mutate()}
              disabled={rebalance.isPending}
              className="w-full"
              variant="default"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", rebalance.isPending && "animate-spin")} />
              {rebalance.isPending ? 'Rebalancing...' : 'Execute Rebalance'}
            </Button>
          )}

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Current LTV</p>
              <p className="text-sm font-medium">{metrics.currentLTV.toFixed(1)}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Health Factor</p>
              <p className="text-sm font-medium">{metrics.healthFactor.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}