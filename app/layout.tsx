import type { Metadata, Viewport } from "next";

import { AppProviders } from "@/components/providers/app-providers";
import { STORE } from "@/lib/constants";
import "./globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#E10600",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://mmart4u.com"),
  title: {
    default: "Mmart | Fresh Groceries Delivered Fast",
    template: "%s | Mmart",
  },
  manifest: "/manifest.webmanifest",
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
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Mmart",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
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
      <body className="min-h-screen overscroll-y-none">
        <AppProviders>{children}        <SpeedInsights />
        </AppProviders>
      </body>
    </html>
  );
}
