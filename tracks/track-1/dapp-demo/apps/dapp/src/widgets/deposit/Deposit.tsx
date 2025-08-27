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
import { useDeposit } from "@/features/vault";
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

interface DepositProps {
	onSuccess?: () => void;
}

export const Deposit = ({ onSuccess }: DepositProps) => {
	const client = useQueryClient();

	const { deposit, isPending } = useDeposit({
		mutation: {
			onSuccess: () => {
				form.reset();
				toast.success("Deposit successful!");
				client.invalidateQueries();
				// Call the onSuccess callback if provided
				onSuccess?.();
			},
			onError: (error, variables) => {
				console.error("Deposit failed:", error, variables);
				toast.error("Deposit failed. See console for details.");
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

		deposit({
			amount: parseUnits(data.amount.toString(), runeMetadata.divisibility),
			address: erc20Address,
			runeId: rune,
		});
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="amount"
					render={() => {
						return (
							<FormItem>
								<FormLabel className="block text-sm font-medium text-bc-black mb-2">
									Lend Amount
								</FormLabel>
								<FormControl>
									<div className="flex gap-2">
										<Input
											type="number"
											step="any"
											placeholder="Enter Amount"
											className="flex-1 px-4 py-3 border-bc-black rounded-lg bg-white text-bc-black placeholder:text-gray-500 focus:ring-2 focus:ring-bc-yellow focus:border-bc-yellow"
											{...form.register("amount")}
										/>
										<Button 
											type="button"
											className="bg-bc-yellow text-bc-black px-4 py-3 rounded-lg font-medium border-bc-black hover:bg-bc-yellow/90 transition-colors"
											onClick={() => {
												// TODO: Implement MAX functionality
												toast.info("MAX functionality coming soon!");
											}}
										>
											MAX
										</Button>
									</div>
								</FormControl>

								<FormDescription className="text-sm text-gray-600 mt-2">
									Enter the amount of Bitcoin Runes you want to lend.
								</FormDescription>
							</FormItem>
						);
					}}
				/>

				<Button
					type="submit"
					className="w-full bg-bc-black text-white py-4 rounded-lg font-bold text-lg border-2 border-white hover:bg-bc-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					disabled={
						!form.formState.isValid || erc20Address === zeroAddress || isPending
					}
				>
					{isPending ? "Lending..." : `LEND ${form.watch("amount") || "0"} ${runeMetadata?.symbol || "RUNES"}`}
				</Button>
			</form>
		</Form>
	);
};
