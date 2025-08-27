"use client";

import { useUtxoIndexer } from "../hooks/useUtxoIndexer";

export function UtxoStats() {
  const { stats, isLoading, error, fetchStats } = useUtxoIndexer();

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);

  if (error) {
    return (
      <div className="card">
        <div className="text-red-600 dark:text-red-400">
          <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
          <p className="text-sm">{error}</p>
          <button onClick={fetchStats} className="btn-secondary mt-3">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        UTXO Indexer Statistics
      </h3>

      {isLoading && !stats ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-200 dark:bg-gray-700 rounded"
              ></div>
            ))}
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.total_utxos.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total UTXOs
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatBTC(stats.total_value)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total BTC
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.current_height.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current Height
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.progress_percent.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Sync Progress
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>No data available</p>
          <button onClick={fetchStats} className="btn-primary mt-3">
            Load Stats
          </button>
        </div>
      )}

      {stats && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="btn-secondary text-xs"
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
