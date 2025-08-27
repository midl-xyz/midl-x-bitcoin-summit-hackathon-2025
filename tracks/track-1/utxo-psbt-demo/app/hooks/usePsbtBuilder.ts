"use client";

import { useCallback } from "react";
import * as bitcoin from "bitcoinjs-lib";

interface UtxoEntry {
  outpoint: string;
  output: {
    value: number;
    script_pubkey: string;
  };
  height: number;
  confirmations: number;
}

interface PsbtOutput {
  address: string;
  value: number;
}

interface PsbtResult {
  psbt: bitcoin.Psbt;
  psbtBase64: string;
  fee: number;
  inputCount: number;
  outputCount: number;
}

export function usePsbtBuilder() {
  const createPsbt = useCallback(
    async (
      utxos: UtxoEntry[],
      outputs: PsbtOutput[],
      feeRate: number = 1,
      network: bitcoin.Network = bitcoin.networks.regtest
    ): Promise<PsbtResult> => {
      try {
        const psbt = new bitcoin.Psbt({ network });

        // Add inputs from selected UTXOs
        for (const utxo of utxos) {
          const [txid, voutStr] = utxo.outpoint.split(":");
          const vout = parseInt(voutStr, 10);

          // For regtest, we'll use a simple witness UTXO
          // In production, you'd need to fetch the full transaction or witness UTXO
          psbt.addInput({
            hash: txid,
            index: vout,
            witnessUtxo: {
              script: Buffer.from(utxo.output.script_pubkey, "hex"),
              value: utxo.output.value,
            },
          });
        }

        // Calculate total input value
        const totalInput = utxos.reduce(
          (sum, utxo) => sum + utxo.output.value,
          0
        );

        // Calculate total output value
        const totalOutput = outputs.reduce(
          (sum, output) => sum + output.value,
          0
        );

        // Add outputs
        for (const output of outputs) {
          psbt.addOutput({
            address: output.address,
            value: output.value,
          });
        }

        // Calculate fee (simple estimation)
        const estimatedSize = utxos.length * 148 + outputs.length * 34 + 10; // rough estimation
        const calculatedFee = estimatedSize * feeRate;

        // Add change output if necessary
        const change = totalInput - totalOutput - calculatedFee;
        if (change > 546) {
          // dust threshold
          // For demo purposes, we'll use a fixed change address
          // In production, you'd generate a proper change address
          const changeAddress = "bcrt1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080"; // example regtest address

          psbt.addOutput({
            address: changeAddress,
            value: change,
          });
        }

        const psbtBase64 = psbt.toBase64();

        return {
          psbt,
          psbtBase64,
          fee: calculatedFee,
          inputCount: utxos.length,
          outputCount: outputs.length + (change > 546 ? 1 : 0),
        };
      } catch (error) {
        console.error("PSBT creation failed:", error);
        throw new Error(
          `Failed to create PSBT: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    },
    []
  );

  const analyzePsbt = useCallback((psbtBase64: string) => {
    try {
      const psbt = bitcoin.Psbt.fromBase64(psbtBase64);

      const inputs = psbt.data.inputs.map((input, index) => ({
        index,
        witnessUtxo: input.witnessUtxo,
        nonWitnessUtxo: input.nonWitnessUtxo,
        sighashType: input.sighashType,
      }));

      const outputs = psbt.txOutputs.map((output, index) => ({
        index,
        address: output.address,
        value: output.value,
      }));

      const totalInput = inputs.reduce((sum, input) => {
        const value = input.witnessUtxo?.value || 0;
        return sum + value;
      }, 0);

      const totalOutput = outputs.reduce(
        (sum, output) => sum + output.value,
        0
      );
      const fee = totalInput - totalOutput;

      return {
        inputs,
        outputs,
        totalInput,
        totalOutput,
        fee,
        inputCount: inputs.length,
        outputCount: outputs.length,
      };
    } catch (error) {
      console.error("PSBT analysis failed:", error);
      throw new Error(
        `Failed to analyze PSBT: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  return {
    createPsbt,
    analyzePsbt,
  };
}
