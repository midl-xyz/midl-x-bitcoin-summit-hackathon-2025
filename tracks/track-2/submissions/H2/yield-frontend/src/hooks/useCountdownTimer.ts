import { useCallback, useEffect, useRef, useState } from 'react';

interface UseCountdownTimerOptions {
  /** Initial time in seconds */
  initialTime: number;
  /** Callback when timer reaches zero */
  onComplete?: () => void;
  /** Callback for each tick (optional) */
  onTick?: (timeRemaining: number) => void;
  /** Whether to start automatically */
  autoStart?: boolean;
  /** Interval in milliseconds (default: 1000ms) */
  interval?: number;
}

interface CountdownTimerState {
  /** Current time remaining in seconds */
  timeRemaining: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Whether the timer has completed */
  isCompleted: boolean;
  /** Start the timer */
  start: () => void;
  /** Pause the timer */
  pause: () => void;
  /** Reset the timer to initial time */
  reset: () => void;
  /** Stop and reset the timer */
  stop: () => void;
  /** Set a new time and optionally start */
  setTime: (seconds: number, startImmediately?: boolean) => void;
}

export const useCountdownTimer = ({
  initialTime,
  onComplete,
  onTick,
  autoStart = false,
  interval = 1000
}: UseCountdownTimerOptions): CountdownTimerState => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialTimeRef = useRef(initialTime);

  // Update initial time ref when prop changes
  useEffect(() => {
    initialTimeRef.current = initialTime;
  }, [initialTime]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (isCompleted) return;
    setIsRunning(true);
  }, [isCompleted]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setTimeRemaining(initialTimeRef.current);
    setIsCompleted(false);
    setIsRunning(false);
    clearTimer();
  }, [clearTimer]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(initialTimeRef.current);
    setIsCompleted(false);
    clearTimer();
  }, [clearTimer]);

  const setTime = useCallback((seconds: number, startImmediately = false) => {
    setTimeRemaining(seconds);
    initialTimeRef.current = seconds;
    setIsCompleted(false);
    if (startImmediately) {
      setIsRunning(true);
    }
  }, []);

  // Main timer effect
  useEffect(() => {
    if (isRunning && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          
          // Call onTick if provided
          onTick?.(newTime);
          
          // Check if completed
          if (newTime === 0) {
            setIsRunning(false);
            setIsCompleted(true);
            clearTimer();
            onComplete?.();
          }
          
          return newTime;
        });
      }, interval);
    } else {
      clearTimer();
    }

    return clearTimer;
  }, [isRunning, isCompleted, interval, onComplete, onTick, clearTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  return {
    timeRemaining,
    isRunning,
    isCompleted,
    start,
    pause,
    reset,
    stop,
    setTime
  };
};