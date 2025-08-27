import * as Vault from "@/shared/contracts/Vault";
import {
	useAddTxIntention,
	useFinalizeBTCTransaction,
	useSignIntention,
} from "@midl/executor-react";
import { useWaitForTransaction } from "@midl/react";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { encodeFunctionData, erc20Abi } from "viem";
import { usePublicClient } from "wagmi";

type UseDepositVariables = {
	amount: bigint;
	runeId: string;
	address: `0x${string}`;
};
type UseDepositParams = {
	mutation?: Omit<
		UseMutationOptions<void, Error, UseDepositVariables>,
		"mutationFn"
	>;
};

export const useDeposit = ({ mutation }: UseDepositParams = {}) => {
	const { addTxIntentionAsync } = useAddTxIntention();
	const publicClient = usePublicClient();
	const { finalizeBTCTransactionAsync } = useFinalizeBTCTransaction();
	const { signIntentionAsync } = useSignIntention();
	const { waitForTransactionAsync } = useWaitForTransaction();

	const { mutate, mutateAsync, ...rest } = useMutation({
		mutationFn: async ({ amount, address, runeId }: UseDepositVariables) => {
			const approveIntention = await addTxIntentionAsync({
				intention: {
					evmTransaction: {
						to: address,
						data: encodeFunctionData({
							abi: erc20Abi,
							functionName: "approve",
							args: [Vault.address, amount],
						}),
					},
				},
				reset: true,
			});

			const depositIntention = await addTxIntentionAsync({
				intention: {
					evmTransaction: {
						to: Vault.address,
						data: encodeFunctionData({
							abi: Vault.abi,
							functionName: "deposit",
							args: [address, amount],
						}),
					},
					deposit: {
						runes: [
							{
								id: runeId,
								amount,
								address,
							},
						],
					},
				},
			});

			const { tx } = await finalizeBTCTransactionAsync();

			const signedTransactions: `0x${string}`[] = [];

			for (const intention of [approveIntention, depositIntention]) {
				const signedTransaction = await signIntentionAsync({
					intention,
					txId: tx.id,
				});
				signedTransactions.push(signedTransaction);
			}

			await publicClient?.sendBTCTransactions({
				serializedTransactions: signedTransactions,
				btcTransaction: tx.hex,
			});

			await waitForTransactionAsync({ txId: tx.id });
		},
		...mutation,
	});

	return {
		deposit: mutate,
		depositAsync: mutateAsync,
		...rest,
	};
};
