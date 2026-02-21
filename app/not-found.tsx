import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="premium-card w-full space-y-4 p-7">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">Page not found</h1>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
          The page you are looking for does not exist.
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </main>
  );
}
