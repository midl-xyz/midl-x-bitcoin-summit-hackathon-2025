export const shortenAddress = (address: `0x${string}` | undefined, length = 6): string => {
    if (!address) return "—";
    if (address.length <= length * 2 + 2) return address;

    return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}