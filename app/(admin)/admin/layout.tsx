import Link from "next/link";

import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Admin Panel</h1>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href="/admin" className="rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800">
            Dashboard
          </Link>
          <Link
            href="/admin/products"
            className="rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800"
          >
            Products
          </Link>
          <Link
            href="/admin/orders"
            className="rounded-full bg-zinc-100 px-3 py-1.5 dark:bg-zinc-800"
          >
            Orders
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}
