import Link from "next/link";
import { CloudOff } from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Offline",
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8">
      <section className="premium-card w-full space-y-4 p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#e10600]">
          <CloudOff size={24} />
        </div>
        <h1 className="font-heading text-2xl font-bold">You are offline</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Mmart is running with limited offline support. Reconnect to continue browsing live data.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="w-full">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full">
              Go Home
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
