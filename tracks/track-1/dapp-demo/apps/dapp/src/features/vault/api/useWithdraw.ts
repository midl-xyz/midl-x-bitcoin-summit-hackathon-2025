import * as Vault from "@/shared/contracts/Vault";
import {
	useAddCompleteTxIntention,
	useAddTxIntention,
	useFinalizeBTCTransaction,
	useSignIntention,
} from "@midl/executor-react";
import { useWaitForTransaction } from "@midl/react";
import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import { encodeFunctionData } from "viem";
import { usePublicClient } from "wagmi";

type UseWithdrawVariables = {
	amount: bigint;
	runeId: string;
	address: `0x${string}`;
};
type UseWithdrawParams = {
	mutation?: Omit<
		UseMutationOptions<void, Error, UseWithdrawVariables>,
		"mutationFn"
	>;
};

export const useWithdraw = ({ mutation }: UseWithdrawParams = {}) => {
	const { addTxIntentionAsync } = useAddTxIntention();
	const { addCompleteTxIntentionAsync } = useAddCompleteTxIntention();
	const publicClient = usePublicClient();
	const { finalizeBTCTransactionAsync } = useFinalizeBTCTransaction();
	const { signIntentionAsync } = useSignIntention();
	const { waitForTransactionAsync } = useWaitForTransaction();

	const { mutate, mutateAsync, ...rest } = useMutation({
		mutationFn: async ({ amount, address, runeId }: UseWithdrawVariables) => {
			const withdrawIntention = await addTxIntentionAsync({
				intention: {
					evmTransaction: {
						to: Vault.address,
						data: encodeFunctionData({
							abi: Vault.abi,
							functionName: "withdraw",
							args: [address, amount],
						}),
					},
				},
				reset: true,
			});

			// Add a complete to withdraw runes to Bitcoin
			const completeIntention = await addCompleteTxIntentionAsync({
				runes: [
					{
						id: runeId,
						amount,
						address,
					},
				],
			});

			const { tx } = await finalizeBTCTransactionAsync();

			const signedTransactions: `0x${string}`[] = [];

			for (const intention of [withdrawIntention, completeIntention]) {
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
		withdraw: mutate,
		withdrawAsync: mutateAsync,
		...rest,
	};
};
