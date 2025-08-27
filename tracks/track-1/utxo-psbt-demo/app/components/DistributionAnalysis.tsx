"use client";

import { useState, useEffect } from "react";
import { useUtxoIndexer } from "../hooks/useUtxoIndexer";

interface DistributionRange {
  range: string;
  count: number;
  value: number;
  percentage: number;
}

interface DistributionAnalysis {
  total_utxos: number;
  total_value: number;
  ranges: DistributionRange[];
  average_value: number;
  median_value: number;
}

export function DistributionAnalysis() {
  const { getDistributionAnalysis, isLoading, error } = useUtxoIndexer();
  const [distribution, setDistribution] = useState<DistributionAnalysis | null>(
    null
  );

  const formatBTC = (sats: number) => (sats / 100000000).toFixed(8);
  const formatSats = (sats: number) => sats.toLocaleString();

  const fetchDistribution = async () => {
    const result = await getDistributionAnalysis();
    if (result) {
      setDistribution(result);
    }
  };

  useEffect(() => {
    fetchDistribution();
  }, []);

  const getBarWidth = (percentage: number) => {
    return `${Math.max(percentage, 0.5)}%`; // Minimum 0.5% width for visibility
  };

  const getBarColor = (index: number) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">UTXO Distribution Analysis</h3>
        <button
          onClick={fetchDistribution}
          disabled={isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {distribution && (
        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total UTXOs</div>
              <div className="text-2xl font-bold text-gray-900">
                {distribution.total_utxos.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatBTC(distribution.total_value)} BTC
              </div>
              <div className="text-xs text-gray-500">
                {formatSats(distribution.total_value)} sats
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Average Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatBTC(distribution.average_value)} BTC
              </div>
              <div className="text-xs text-gray-500">
                {formatSats(distribution.average_value)} sats
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Median Value</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatBTC(distribution.median_value)} BTC
              </div>
              <div className="text-xs text-gray-500">
                {formatSats(distribution.median_value)} sats
              </div>
            </div>
          </div>

          {/* Distribution Chart */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium">UTXO Value Distribution</h4>

            <div className="space-y-3">
              {distribution.ranges.map((range, index) => (
                <div key={range.range} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{range.range}</span>
                    <span className="text-gray-600">
                      {range.count.toLocaleString()} UTXOs (
                      {range.percentage.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`h-full ${getBarColor(
                        index
                      )} transition-all duration-300 ease-out`}
                      style={{ width: getBarWidth(range.percentage) }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-xs font-medium text-white mix-blend-difference">
                        {formatBTC(range.value)} BTC
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-900">
                    Range
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-900">
                    Count
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-900">
                    Total Value (BTC)
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-900">
                    Total Value (sats)
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-900">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody>
                {distribution.ranges.map((range, index) => (
                  <tr
                    key={range.range}
                    className={index % 2 === 0 ? "bg-gray-50" : ""}
                  >
                    <td className="py-2 px-3 font-medium">{range.range}</td>
                    <td className="py-2 px-3 text-right">
                      {range.count.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {formatBTC(range.value)}
                    </td>
                    <td className="py-2 px-3 text-right text-gray-600">
                      {formatSats(range.value)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {range.percentage.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!distribution && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          Click "Refresh" to load UTXO distribution data
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-sm text-gray-600 mb-2">
          API Usage Example:
        </h4>
        <pre className="text-xs text-gray-500 overflow-x-auto">
          {`curl http://localhost:3030/analysis/distribution`}
        </pre>
      </div>
    </div>
  );
}
