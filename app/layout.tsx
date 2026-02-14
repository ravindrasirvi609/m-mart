import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import { STORE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mmart.example"),
  title: {
    default: "Mmart | Grocery Delivery in Hinjewadi",
    template: "%s | Mmart",
  },
  description:
    "Order fresh groceries online from Mmart, Mukai Nagar, Hinjewadi Phase 1, Pune.",
  keywords: [
    "Mmart",
    "grocery delivery",
    "Hinjewadi",
    "Pune",
    "UPI grocery order",
  ],
  openGraph: {
    title: "Mmart Grocery Store",
    description: `Shop groceries from ${STORE.location}`,
    type: "website",
    siteName: STORE.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
