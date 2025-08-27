"use client";

import { useState } from "react";
import { usePsbtBuilder } from "../hooks/usePsbtBuilder";

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

interface PsbtBuilderProps {
  selectionResult: SelectionResult | null;
  onPsbtCreated: (psbtBase64: string) => void;
}

export function PsbtBuilder({
  selectionResult,
  onPsbtCreated,
}: PsbtBuilderProps) {
  const { createPsbt } = usePsbtBuilder();
  const [outputs, setOutputs] = useState([{ address: "", value: "" }]);
  const [feeRate, setFeeRate] = useState("1");
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);

  const addOutput = () => {
    setOutputs([...outputs, { address: "", value: "" }]);
  };

  const removeOutput = (index: number) => {
    if (outputs.length > 1) {
      setOutputs(outputs.filter((_, i) => i !== index));
    }
  };

  const updateOutput = (
    index: number,
    field: "address" | "value",
    value: string
  ) => {
    const newOutputs = [...outputs];
    newOutputs[index] = { ...newOutputs[index], [field]: value };
    setOutputs(newOutputs);
  };

  const handleBuildPsbt = async () => {
    if (!selectionResult) return;

    try {
      setIsBuilding(true);
      setError(null);

      // Validate outputs
      const validOutputs = outputs.filter((o) => o.address && o.value);
      if (validOutputs.length === 0) {
        throw new Error("At least one valid output is required");
      }

      const psbtOutputs = validOutputs.map((output) => ({
        address: output.address,
        value: Math.floor(parseFloat(output.value) * 100000000), // Convert to satoshis
      }));

      const result = await createPsbt(
        selectionResult.utxos,
        psbtOutputs,
        parseInt(feeRate)
      );

      onPsbtCreated(result.psbtBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create PSBT");
    } finally {
      setIsBuilding(false);
    }
  };

  if (!selectionResult) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          PSBT Builder
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Select UTXOs first to build a PSBT</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        PSBT Builder
      </h3>

      {/* Selection Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          Selected UTXOs
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Count: </span>
            <span className="font-medium">{selectionResult.utxos.length}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total: </span>
            <span className="font-medium">
              {formatBTC(selectionResult.total_amount)} BTC
            </span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Strategy: </span>
            <span className="font-medium">{selectionResult.strategy}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Change: </span>
            <span className="font-medium">
              {formatBTC(selectionResult.change_amount)} BTC
            </span>
          </div>
        </div>
      </div>

      {/* Outputs Configuration */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-medium text-gray-900 dark:text-white">Outputs</h4>
          <button onClick={addOutput} className="btn-secondary text-sm">
            Add Output
          </button>
        </div>

        {outputs.map((output, index) => (
          <div key={index} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <input
                type="text"
                value={output.address}
                onChange={(e) => updateOutput(index, "address", e.target.value)}
                placeholder="bcrt1q..."
                className="input-field"
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount (BTC)
              </label>
              <input
                type="number"
                step="0.00000001"
                value={output.value}
                onChange={(e) => updateOutput(index, "value", e.target.value)}
                placeholder="0.00000000"
                className="input-field"
              />
            </div>
            {outputs.length > 1 && (
              <button
                onClick={() => removeOutput(index)}
                className="btn-secondary text-sm h-10"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        <div className="w-32">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Fee Rate (sat/vB)
          </label>
          <input
            type="number"
            value={feeRate}
            onChange={(e) => setFeeRate(e.target.value)}
            className="input-field"
          />
        </div>

        <button
          onClick={handleBuildPsbt}
          disabled={isBuilding}
          className="btn-primary w-full"
        >
          {isBuilding ? "Building PSBT..." : "Create PSBT"}
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
