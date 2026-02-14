import type { Metadata } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import { STORE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mmart.example"),
  title: {
    default: "Mmart | Fresh Groceries Delivered Fast",
    template: "%s | Mmart",
  },
  description:
    "Mmart delivers fresh groceries across Mukai Nagar, Hinjewadi Phase 1, Pune with secure UPI payment verification.",
  keywords: [
    "Mmart",
    "grocery delivery Pune",
    "Hinjewadi groceries",
    "UPI grocery checkout",
    "fresh vegetables online",
  ],
  openGraph: {
    title: "Mmart Grocery Delivery",
    description: `Order groceries online from ${STORE.location}`,
    type: "website",
    siteName: STORE.name,
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "Mmart",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mmart Grocery Delivery",
    description: `Fast delivery in ${STORE.location}`,
    images: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
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
