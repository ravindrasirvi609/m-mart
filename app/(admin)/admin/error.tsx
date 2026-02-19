"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center rounded-2xl border border-admin-border bg-admin-card p-6 text-center sm:p-8">
      <div className="rounded-full border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
        <AlertTriangle size={22} />
      </div>
      <h1 className="mt-4 font-heading text-2xl font-black text-text-main">
        Admin page error
      </h1>
      <p className="mt-2 text-sm text-text-subtle">
        {error.message || "We could not load this page. Please try again."}
      </p>
      <div className="mt-5 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        <Button onClick={reset} className="w-full sm:w-auto">
          <RefreshCw size={16} />
          Retry
        </Button>
        <Link
          href="/admin"
          className="inline-flex w-full items-center justify-center rounded-xl border border-[#e10600]/40 px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#e10600] transition-colors hover:bg-[#e10600]/10 sm:w-auto"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
