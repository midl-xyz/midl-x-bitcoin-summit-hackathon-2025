import { calculateTransactionsCost, multisigAddress } from "@midl/executor";
import { useBTCFeeRate } from "@midl/executor-react";
import { useConfig, useEdictRune, useWaitForTransaction } from "@midl/react";

type UseAddRuneParams = {
	mutation?: NonNullable<
		Parameters<typeof useWaitForTransaction>[0]
	>["mutation"];
};

export const useAddRune = ({ mutation }: UseAddRuneParams) => {
	const { edictRune, ...rest } = useEdictRune({
		mutation: {
			onSuccess: (data) => {
				waitForTransaction({
					txId: data.tx.id,
				});
			},
		},
	});
	const { network } = useConfig();
	const { data: feeRate } = useBTCFeeRate();
	const { waitForTransaction, ...restWait } = useWaitForTransaction({
		mutation,
	});

	const addRune = (runeId: string) => {
		if (!feeRate) {
			throw new Error("Fee rate is not available");
		}

		// Calculate the mint fee based on the current fee rate and the rune deposit
		const mintFee = calculateTransactionsCost(0n, {
			feeRate: Number(feeRate),
			hasRunesDeposit: true,
		});

		edictRune({
			transfers: [
				{
					receiver: multisigAddress[network.id],
					amount: mintFee,
				},
				{
					runeId,
					amount: 1n,
					receiver: multisigAddress[network.id],
				},
			],
			publish: true,
		});
	};

	return {
		addRune,
		...rest,
		waitState: restWait,
	};
};
