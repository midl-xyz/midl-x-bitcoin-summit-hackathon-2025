"use client";

import { useState } from "react";
import { useUtxoIndexer } from "../hooks/useUtxoIndexer";

interface WalletUtxoSelectorProps {
  onUtxosSelected: (result: any) => void;
}

export function WalletUtxoSelector({
  onUtxosSelected,
}: WalletUtxoSelectorProps) {
  const { selectUtxosForWallet, isLoading, error } = useUtxoIndexer();
  const [walletAddress, setWalletAddress] = useState(
    "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
  );
  const [targetAmount, setTargetAmount] = useState("");
  const [strategy, setStrategy] = useState("largest_first");
  const [maxUtxos, setMaxUtxos] = useState("5");
  const [feeRate, setFeeRate] = useState("10.0");
  const [outputCount, setOutputCount] = useState("2");
  const [minConfirmations, setMinConfirmations] = useState("1");
  const [excludeCoinbase, setExcludeCoinbase] = useState(false);

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);

  const handleSelect = async () => {
    if (!targetAmount || !walletAddress) return;

    const amountSats = Math.floor(parseFloat(targetAmount) * 100000000);
    const criteria = {
      target_amount: amountSats,
      strategy,
      max_utxos: maxUtxos ? parseInt(maxUtxos) : undefined,
      fee_rate_sat_per_vbyte: feeRate ? parseFloat(feeRate) : undefined,
      output_count: outputCount ? parseInt(outputCount) : undefined,
      min_confirmations: minConfirmations
        ? parseInt(minConfirmations)
        : undefined,
      exclude_coinbase: excludeCoinbase,
    };

    const result = await selectUtxosForWallet(walletAddress, criteria);

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
    { value: "knapsack", label: "Knapsack" },
    { value: "effective_value", label: "Effective Value" },
  ];

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4">
        Wallet-Specific UTXO Selection
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Wallet Address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Bitcoin wallet address"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Target Amount (BTC)
            </label>
            <input
              type="number"
              step="0.00000001"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.005"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Selection Strategy
            </label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {strategies.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Max UTXOs</label>
            <input
              type="number"
              value={maxUtxos}
              onChange={(e) => setMaxUtxos(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Fee Rate (sat/vB)
            </label>
            <input
              type="number"
              step="0.1"
              value={feeRate}
              onChange={(e) => setFeeRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="10.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Output Count
            </label>
            <input
              type="number"
              value={outputCount}
              onChange={(e) => setOutputCount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Min Confirmations
            </label>
            <input
              type="number"
              value={minConfirmations}
              onChange={(e) => setMinConfirmations(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1"
            />
          </div>

          <div className="flex items-center mt-6">
            <input
              type="checkbox"
              id="excludeCoinbase"
              checked={excludeCoinbase}
              onChange={(e) => setExcludeCoinbase(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="excludeCoinbase" className="text-sm font-medium">
              Exclude Coinbase UTXOs
            </label>
          </div>
        </div>

        <button
          onClick={handleSelect}
          disabled={isLoading || !targetAmount || !walletAddress}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Selecting UTXOs..." : "Select UTXOs for Wallet"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            Error: {error}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm text-gray-600 mb-2">
          API Usage Example:
        </h4>
        <pre className="text-xs text-gray-500 overflow-x-auto">
          {`curl -X POST http://localhost:3030/wallet/${walletAddress}/select \\
  -H "Content-Type: application/json" \\
  -d '{
    "target_amount": ${
      targetAmount ? Math.floor(parseFloat(targetAmount) * 100000000) : 500000
    },
    "strategy": "${strategy}",
    "max_utxos": ${maxUtxos || 5},
    "fee_rate_sat_per_vbyte": ${feeRate || 10.0},
    "output_count": ${outputCount || 2}
  }'`}
        </pre>
      </div>
    </div>
  );
}
