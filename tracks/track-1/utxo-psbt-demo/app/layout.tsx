import type { Metadata } from "next";
import "./globals.css";
import { Web3Provider } from "./providers/Web3Provider";

export const metadata: Metadata = {
  title: "UTXO PSBT Demo",
  description: "Demo app showing UTXO selection and PSBT creation with MIDL",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Web3Provider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      UTXO PSBT Demo
                    </h1>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      UTXO Indexer-Selector + MIDL Integration
                    </span>
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </Web3Provider>
      </body>
    </html>
  );
}
