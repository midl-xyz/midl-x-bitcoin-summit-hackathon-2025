"use client";

import { useState } from "react";
import { useUtxoIndexer } from "../hooks/useUtxoIndexer";

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

interface UtxoSelectorProps {
  onUtxosSelected: (result: SelectionResult) => void;
}

export function UtxoSelector({ onUtxosSelected }: UtxoSelectorProps) {
  const { selectUtxos, isLoading, error } = useUtxoIndexer();
  const [targetAmount, setTargetAmount] = useState("");
  const [strategy, setStrategy] = useState("largest_first");
  const [maxUtxos, setMaxUtxos] = useState("10");

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);

  const handleSelect = async () => {
    if (!targetAmount) return;

    const amountSats = Math.floor(parseFloat(targetAmount) * 100000000);
    const result = await selectUtxos(
      amountSats,
      strategy,
      maxUtxos ? parseInt(maxUtxos) : undefined
    );

    if (result) {
      onUtxosSelected(result);
    }
  };

  const strategies = [
    { value: "largest_first", label: "Largest First" },
    { value: "smallest_first", label: "Smallest First" },
    { value: "branch_and_bound", label: "Branch and Bound" },
    { value: "oldest_first", label: "Oldest First" },
    { value: "newest_first", label: "Newest First" },
  ];

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        UTXO Selection
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Target Amount (BTC)
          </label>
          <input
            type="number"
            step="0.00000001"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00000000"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selection Strategy
          </label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value)}
            className="input-field"
          >
            {strategies.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max UTXOs (optional)
          </label>
          <input
            type="number"
            value={maxUtxos}
            onChange={(e) => setMaxUtxos(e.target.value)}
            placeholder="10"
            className="input-field"
          />
        </div>

        <button
          onClick={handleSelect}
          disabled={isLoading || !targetAmount}
          className="btn-primary w-full"
        >
          {isLoading ? "Selecting UTXOs..." : "Select UTXOs"}
        </button>

        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
