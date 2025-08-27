"use client";

import { useState } from "react";
import { UtxoStats } from "./components/UtxoStats";
import { UtxoSelector } from "./components/UtxoSelector";
import { WalletUtxoSelector } from "./components/WalletUtxoSelector";
import { DistributionAnalysis } from "./components/DistributionAnalysis";
import { PsbtBuilder } from "./components/PsbtBuilder";
import { PsbtSigner } from "./components/PsbtSigner";

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

export default function Home() {
  const [selectionResult, setSelectionResult] =
    useState<SelectionResult | null>(null);
  const [psbtBase64, setPsbtBase64] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const handleUtxosSelected = (result: SelectionResult) => {
    setSelectionResult(result);
    setPsbtBase64(null); // Reset PSBT when new UTXOs are selected
  };

  const handlePsbtCreated = (psbt: string) => {
    setPsbtBase64(psbt);
  };

  const tabs = [
    { id: "general", label: "General UTXO Selection" },
    { id: "wallet", label: "Wallet-Specific Selection" },
    { id: "analysis", label: "Distribution Analysis" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          UTXO PSBT Demo
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Demonstrating UTXO selection, PSBT creation, and signing with MIDL
          integration
        </p>
      </div>

      {/* Stats Section */}
      <div className="mb-8">
        <UtxoStats />
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Workflow */}
      {activeTab === "analysis" ? (
        <div className="space-y-8">
          <DistributionAnalysis />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - UTXO Selection */}
          <div className="space-y-8">
            {activeTab === "general" && (
              <UtxoSelector onUtxosSelected={handleUtxosSelected} />
            )}
            {activeTab === "wallet" && (
              <WalletUtxoSelector onUtxosSelected={handleUtxosSelected} />
            )}

            {selectionResult && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Selection Results
                </h3>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Selected UTXOs:{" "}
                      </span>
                      <span className="font-medium">
                        {selectionResult.utxos.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Total Amount:{" "}
                      </span>
                      <span className="font-medium">
                        {(selectionResult.total_amount / 100000000).toFixed(8)}{" "}
                        BTC
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Change:{" "}
                      </span>
                      <span className="font-medium">
                        {(selectionResult.change_amount / 100000000).toFixed(8)}{" "}
                        BTC
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        Strategy:{" "}
                      </span>
                      <span className="font-medium">
                        {selectionResult.strategy}
                      </span>
                    </div>
                  </div>

                  {/* UTXO List */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Selected UTXOs:
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {selectionResult.utxos.slice(0, 10).map((utxo, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded"
                        >
                          <span className="font-mono truncate">
                            {utxo.outpoint.slice(0, 20)}...
                          </span>
                          <span className="font-medium">
                            {(utxo.output.value / 100000000).toFixed(8)} BTC
                          </span>
                        </div>
                      ))}
                      {selectionResult.utxos.length > 10 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          ... and {selectionResult.utxos.length - 10} more UTXOs
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - PSBT Building and Signing */}
          <div className="space-y-8">
            <PsbtBuilder
              selectionResult={selectionResult}
              onPsbtCreated={handlePsbtCreated}
            />

            <PsbtSigner psbtBase64={psbtBase64} />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p className="mb-2">This demo showcases the integration between:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
              UTXO Indexer-Selector
            </span>
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
              PSBT Creation
            </span>
            <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
              MIDL Signing
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
