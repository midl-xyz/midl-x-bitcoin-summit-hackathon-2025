"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRuneStore } from "@/features";
import { useWithdraw } from "@/features/vault";
import { zodResolver } from "@hookform/resolvers/zod";
import { useERC20Rune } from "@midl/executor-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { parseUnits, zeroAddress } from "viem";
import { z } from "zod";

const formSchema = z.object({
	amount: z
		.custom<number>()
		.refine((value) => value ?? false, "Required")
		.refine((value) => Number.isFinite(Number(value)), "Invalid number")
		.transform((value) => Number(value)),
});

type FormData = z.infer<typeof formSchema>;

export const Withdraw = () => {
	const client = useQueryClient();

	const { withdraw, isPending } = useWithdraw({
		mutation: {
			onSuccess: () => {
				form.reset();
				toast.success("Withdrawal successful!");
				client.invalidateQueries();
			},
			onError: (error, variables) => {
				console.error("Withdrawal failed:", error, variables);
				toast.error("Withdrawal failed. See console for details.");
			},
		},
	});

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		reValidateMode: "onChange",
	});

	const { rune } = useRuneStore();
	// biome-ignore lint/style/noNonNullAssertion: Rune is defined if the user has selected a rune
	const { erc20Address, rune: runeMetadata } = useERC20Rune(rune!, {
		query: {
			enabled: Boolean(rune),
		},
	});

	const handleSubmit = (data: FormData) => {
		if (
			!runeMetadata ||
			!rune ||
			!erc20Address ||
			erc20Address === zeroAddress
		) {
			throw new Error("Rune or ERC20 address is not available");
		}

		withdraw({
			amount: parseUnits(data.amount.toString(), runeMetadata.divisibility),
			address: erc20Address,
			runeId: rune,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
				<FormField
					control={form.control}
					name="amount"
					render={() => {
						return (
							<FormItem>
								<FormLabel>Withdrawal Amount</FormLabel>
								<FormControl>
									<Input
										step="any"
										type="number"
										placeholder="Enter amount to withdraw"
										{...form.register("amount")}
									/>
								</FormControl>

								<FormDescription>
									Enter the amount of Bitcoin Runes you want to withdraw.
								</FormDescription>
							</FormItem>
						);
					}}
				/>

				<Button
					type="submit"
					className="w-full"
					disabled={
						!form.formState.isValid || erc20Address === zeroAddress || isPending
					}
				>
					{isPending ? "Withdrawing..." : "Withdraw"}
				</Button>
			</form>
		</Form>
	);
};
