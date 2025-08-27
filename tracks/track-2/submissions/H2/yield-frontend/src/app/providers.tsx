'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { Web3Provider } from '@/components/providers/Web3Provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Web3Provider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </Web3Provider>
  );
}