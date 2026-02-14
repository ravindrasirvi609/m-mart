"use client";

import { WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export function NoInternetScreen() {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/95 px-5 text-center backdrop-blur dark:bg-zinc-950/95">
      <div className="premium-card w-full max-w-sm space-y-4 p-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#e10600] dark:bg-red-950/40">
          <WifiOff size={22} />
        </div>
        <h2 className="font-heading text-xl font-bold">No Internet Connection</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Check your network and retry. Your cart and session remain safe.
        </p>
        <Button className="w-full" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
