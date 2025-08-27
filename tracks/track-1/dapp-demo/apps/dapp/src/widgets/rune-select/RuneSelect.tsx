"use client";
import { useAccounts, useRunes } from "@midl/react";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useERC20Rune } from "@midl/executor-react";
import { zeroAddress } from "viem";
import { useAddRune, useRuneStore } from "@/features";
import { toast } from "sonner";

export function RuneSelect() {
	const { rune: storedRune, setRune } = useRuneStore();
	const [open, setOpen] = useState(false);
	const [value, setValue] = useState<string | undefined>(storedRune);
	const { ordinalsAccount } = useAccounts();

	const { runes } = useRunes({
		address: ordinalsAccount?.address,
		query: { enabled: Boolean(ordinalsAccount?.address) },
	});

	const selectedRune = runes?.results.find((rune) => rune.rune.id === value);

	const { erc20Address, erc20State, rune, state } = useERC20Rune(
		selectedRune?.rune.id as string,
		{
			query: { enabled: Boolean(selectedRune?.rune.id) },
		},
	);

	const { addRune, isPending, waitState } = useAddRune({
		mutation: {
			onError: (error) => {
				console.error("Failed to add rune:", error);
				toast.error("Failed to add rune. See console for details.");
			},
			onSuccess: () => {
				state.refetch();
				erc20State.refetch();

				toast.success("Rune added successfully!");
			},
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: setToken is memoized
	useEffect(() => {
		setRune(rune?.id);
	}, [rune]);

	return (
		<div>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					{/** biome-ignore lint/a11y/useSemanticElements: This is a custom select component */}
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className="w-full justify-between"
						disabled={!ordinalsAccount || !runes?.results.length}
					>
						{value && ordinalsAccount
							? runes?.results?.find((rune) => rune.rune.id === value)?.rune
									.spaced_name
							: "Select rune..."}
						<ChevronsUpDown className="opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
					<Command
						filter={(value, search) => {
							const rune = runes?.results.find(
								(rune) =>
									rune.rune.id === value &&
									rune.rune.spaced_name
										.toLocaleLowerCase()
										.includes(search.toLocaleLowerCase()),
							);
							if (rune) {
								return 1;
							}

							return 0;
						}}
					>
						<CommandInput placeholder="Search rune..." className="h-9" />
						<CommandList>
							<CommandEmpty>No rune found.</CommandEmpty>
							<CommandGroup>
								{runes?.results.map((rune) => (
									<CommandItem
										key={rune.rune.id}
										value={rune.rune.id}
										onSelect={(currentValue) => {
											setValue(currentValue);
											setOpen(false);
										}}
									>
										{rune.rune.spaced_name}
										<Check
											className={cn(
												"ml-auto",
												value === rune.rune.id ? "opacity-100" : "opacity-0",
											)}
										/>
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{erc20State.isFetching && (
				<div className="mt-2 text-sm text-muted-foreground">
					<LoaderCircle className="inline mr-2 animate-spin" />
					Loading rune details...
				</div>
			)}

			{selectedRune && rune && !erc20State.isFetching && (
				<div className="mt-2">
					{selectedRune.balance ? (
						<div className="text-sm text-muted-foreground">
							Balance: {selectedRune.balance} {rune.symbol}
						</div>
					) : (
						<div className="text-sm text-red-500">
							Rune balance not available.
						</div>
					)}

					{erc20Address !== zeroAddress ? (
						<div className="text-sm text-muted-foreground">
							ERC20 Address: {erc20Address}
						</div>
					) : (
						<div>
							<Button
								variant="outline"
								className="mt-2 w-full"
								disabled={isPending || waitState.isPending}
								onClick={() => {
									addRune(rune.id);
								}}
							>
								{isPending || waitState.isPending ? (
									<LoaderCircle className="inline mr-2 animate-spin" />
								) : (
									"Add Rune"
								)}
							</Button>
							<p className="mt-2 text-xs text-muted-foreground">
								To add a Rune to the ecosystem, an edict is created to the TSS
								Vault with the Rune's minimum amount. Please, confirm the
								transaction in your wallet.
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
