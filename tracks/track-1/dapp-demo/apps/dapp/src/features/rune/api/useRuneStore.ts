import { create } from "zustand";

export const useRuneStore = create<{
    rune: string | undefined;
    setRune: (token: string | undefined) => void;
}>((set) => ({
    rune: undefined,
    setRune: (rune) => set({ rune }),
}));
