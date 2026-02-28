"use client";

import { Toaster } from "sonner";

import { MobileRuntime } from "@/components/mobile/mobile-runtime";
import { CartProvider } from "@/components/providers/cart-provider";
import { PresenceProvider } from "@/components/providers/presence-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <PresenceProvider>{children}</PresenceProvider>
        <MobileRuntime />
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
