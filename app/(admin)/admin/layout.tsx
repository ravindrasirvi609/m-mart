import Link from "next/link";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { requireAdmin } from "@/lib/auth";
import { getCurrentUserNotifications } from "@/lib/queries";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();
  const notifications = await getCurrentUserNotifications({
    userId: user.id,
    isAdmin: true,
  });

  return (
    <div className="grid min-h-screen bg-[#0f1016] text-zinc-100 lg:grid-cols-[240px_1fr]">
      <aside className="border-r border-white/10 bg-gradient-to-b from-[#14151e] to-[#0d0e14] p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl font-black text-white">Mmart Admin</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-red-300">Operations Panel</p>
          </div>
          <NotificationCenter
            mode="admin"
            userId={user.id}
            initialNotifications={notifications}
          />
        </div>

        <nav className="mt-6 grid gap-2">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-[#e10600]/40 hover:bg-[#e10600]/15"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="p-4 sm:p-6">{children}</main>
    </div>
  );
}
