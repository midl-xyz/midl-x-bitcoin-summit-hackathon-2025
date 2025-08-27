'use client';

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  /** Current time remaining in seconds */
  timeRemaining: number;
  /** Total time in seconds */
  totalTime: number;
  /** Custom className for styling */
  className?: string;
  /** Show time text */
  showTimeText?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  /** Color variant */
  variant?: 'default' | 'destructive' | 'warning' | 'success';
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  timeRemaining,
  totalTime,
  className,
  showTimeText = true,
  size = 'default',
  variant = 'default'
}) => {
  const progressPercentage = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sizeClasses = {
    sm: 'h-1',
    default: 'h-2',
    lg: 'h-3'
  };

  const variantClasses = {
    default: '',
    destructive: '[&>div]:bg-destructive',
    warning: '[&>div]:bg-yellow-500',
    success: '[&>div]:bg-green-500'
  };

  const getTimeTextColor = () => {
    if (timeRemaining <= 5) return 'text-destructive';
    if (timeRemaining <= 15) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn('space-y-2', className)}>
      {showTimeText && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Time remaining</span>
          <span className={cn('font-mono font-medium', getTimeTextColor())}>
            {formatTime(timeRemaining)}
          </span>
        </div>
      )}
      <Progress 
        value={progressPercentage} 
        className={cn(
          sizeClasses[size],
          variantClasses[variant],
          'transition-all duration-300'
        )}
      />
    </div>
  );
};