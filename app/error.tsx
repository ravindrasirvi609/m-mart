"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="premium-card w-full space-y-4 p-7">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Something went wrong
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          Please try again. If the problem continues, contact support.
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
