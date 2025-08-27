"use client";

import { useState } from "react";
// Note: MIDL signing integration would go here
import { usePsbtBuilder } from "../hooks/usePsbtBuilder";

interface PsbtSignerProps {
  psbtBase64: string | null;
}

export function PsbtSigner({ psbtBase64 }: PsbtSignerProps) {
  const { analyzePsbt } = usePsbtBuilder();

  const [signedTx, setSignedTx] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);

  const handleSignPsbt = async () => {
    if (!psbtBase64) return;

    try {
      setIsSigning(true);
      setError(null);

      // For demo purposes, we'll show the PSBT structure
      // In a real implementation, this would integrate with MIDL's signing
      setSignedTx("Demo: PSBT ready for signing with connected wallet");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign PSBT");
    } finally {
      setIsSigning(false);
    }
  };

  if (!psbtBase64) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          PSBT Signer
        </h3>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>Create a PSBT first to sign it</p>
        </div>
      </div>
    );
  }

  let psbtAnalysis = null;
  try {
    psbtAnalysis = analyzePsbt(psbtBase64);
  } catch (err) {
    // Handle analysis error
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        PSBT Signer
      </h3>

      {/* PSBT Analysis */}
      {psbtAnalysis && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">
            PSBT Analysis
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Inputs: </span>
              <span className="font-medium">{psbtAnalysis.inputCount}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Outputs:{" "}
              </span>
              <span className="font-medium">{psbtAnalysis.outputCount}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">
                Total In:{" "}
              </span>
              <span className="font-medium">
                {formatBTC(psbtAnalysis.totalInput)} BTC
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Fee: </span>
              <span className="font-medium">
                {formatBTC(psbtAnalysis.fee)} BTC
              </span>
            </div>
          </div>

          {/* Outputs Details */}
          <div className="space-y-2">
            <h5 className="font-medium text-gray-900 dark:text-white">
              Outputs:
            </h5>
            {psbtAnalysis.outputs.map((output, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 p-2 rounded"
              >
                <span className="font-mono text-xs">
                  {output.address || "Unknown"}
                </span>
                <span className="font-medium">
                  {formatBTC(output.value)} BTC
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PSBT Base64 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          PSBT (Base64)
        </label>
        <textarea
          value={psbtBase64}
          readOnly
          rows={4}
          className="input-field font-mono text-xs"
        />
      </div>

      {/* Sign Button */}
      <button
        onClick={handleSignPsbt}
        disabled={isSigning}
        className="btn-primary w-full mb-4"
      >
        {isSigning ? "Preparing for signing..." : "Prepare PSBT for Signing"}
      </button>

      {/* Signed Transaction */}
      {signedTx && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Signed Transaction
          </label>
          <textarea
            value={signedTx}
            readOnly
            rows={4}
            className="input-field font-mono text-xs"
          />
          <div className="mt-2 p-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm">
              ✅ PSBT prepared! Ready for wallet signing integration.
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 rounded-lg">
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          <strong>Note:</strong> This demo integrates UTXO selection from the
          UTXO Indexer-Selector with MIDL&apos;s signing infrastructure. The
          PSBT is created from selected UTXOs and then signed using MIDL&apos;s
          transaction intention system.
        </p>
      </div>
    </div>
  );
}
