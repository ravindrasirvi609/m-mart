"use client";

import { Toaster } from "sonner";

import { CartProvider } from "@/components/providers/cart-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "!border !border-red-100 !bg-white !text-zinc-900 dark:!border-zinc-700 dark:!bg-zinc-900 dark:!text-zinc-100",
            },
          }}
        />
      </CartProvider>
    </ThemeProvider>
  );
}
