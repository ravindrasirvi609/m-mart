"use client";

import { Toaster } from "sonner";

import { CartProvider } from "@/components/providers/cart-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        {children}
        <Toaster richColors position="top-right" />
      </CartProvider>
    </ThemeProvider>
  );
}
