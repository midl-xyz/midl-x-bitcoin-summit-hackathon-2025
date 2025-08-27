"use client";

import { useState, useEffect, useCallback } from "react";

interface UtxoStats {
  total_utxos: number;
  total_value: number;
  current_height: number;
  progress_percent: number;
}

interface UtxoEntry {
  outpoint: string;
  output: {
    value: number;
    script_pubkey: string;
  };
  height: number;
  confirmations: number;
}

interface SelectionResult {
  utxos: UtxoEntry[];
  total_amount: number;
  change_amount: number;
  strategy: string;
}

interface WalletSelectionCriteria {
  target_amount: number;
  strategy?: string;
  max_utxos?: number;
  fee_rate_sat_per_vbyte?: number;
  output_count?: number;
  min_confirmations?: number;
  exclude_coinbase?: boolean;
}

interface DistributionAnalysis {
  total_utxos: number;
  total_value: number;
  ranges: {
    range: string;
    count: number;
    value: number;
    percentage: number;
  }[];
  average_value: number;
  median_value: number;
}

const API_BASE =
  process.env.NEXT_PUBLIC_UTXO_API_BASE || "http://localhost:3030";

export function useUtxoIndexer() {
  const [stats, setStats] = useState<UtxoStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function for API calls
  const apiCall = useCallback(
    async (endpoint: string, options: RequestInit = {}) => {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return response.json();
    },
    []
  );

  // Fetch current stats
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await apiCall("/stats");

      if (result.success) {
        setStats(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [apiCall]);

  // Select UTXOs
  const selectUtxos = useCallback(
    async (
      targetAmount: number,
      strategy: string = "largest_first",
      maxUtxos?: number
    ): Promise<SelectionResult | null> => {
      try {
        setIsLoading(true);
        const result = await apiCall("/select", {
          method: "POST",
          body: JSON.stringify({
            target_amount: targetAmount,
            strategy,
            max_utxos: maxUtxos,
          }),
        });

        if (result.success) {
          setError(null);
          return result.data;
        } else {
          setError(result.error);
          return null;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Selection failed");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall]
  );

  // Get UTXOs with filters
  const getUtxos = useCallback(
    async (
      filters: {
        minAmount?: number;
        maxAmount?: number;
        minConfirmations?: number;
        limit?: number;
      } = {}
    ): Promise<UtxoEntry[]> => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.append(
              key.replace(/([A-Z])/g, "_$1").toLowerCase(),
              value.toString()
            );
          }
        });

        const result = await apiCall(
          `/utxos${params.toString() ? "?" + params : ""}`
        );

        if (result.success) {
          setError(null);
          return result.data;
        } else {
          setError(result.error);
          return [];
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch UTXOs");
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall]
  );

  // Check health
  const checkHealth = useCallback(async () => {
    try {
      const result = await apiCall("/health");
      return result.success ? result.data : null;
    } catch (err) {
      console.error("Health check failed:", err);
      return null;
    }
  }, [apiCall]);

  // Select UTXOs for specific wallet address
  const selectUtxosForWallet = useCallback(
    async (
      walletAddress: string,
      criteria: WalletSelectionCriteria
    ): Promise<SelectionResult | null> => {
      try {
        setIsLoading(true);
        const result = await apiCall(`/wallet/${walletAddress}/select`, {
          method: "POST",
          body: JSON.stringify(criteria),
        });

        if (result.success) {
          setError(null);
          return result.data;
        } else {
          setError(result.error);
          return null;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Wallet UTXO selection failed"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [apiCall]
  );

  // Get UTXO distribution analysis
  const getDistributionAnalysis =
    useCallback(async (): Promise<DistributionAnalysis | null> => {
      try {
        setIsLoading(true);
        const result = await apiCall("/analysis/distribution");

        if (result.success) {
          setError(null);
          return result.data;
        } else {
          setError(result.error);
          return null;
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Distribution analysis failed"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    }, [apiCall]);

  // Auto-refresh stats
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
    selectUtxos,
    selectUtxosForWallet,
    getUtxos,
    getDistributionAnalysis,
    checkHealth,
  };
}
