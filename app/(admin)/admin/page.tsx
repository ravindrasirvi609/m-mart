import { getAdminDashboardData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#1a1b25] to-[#1f1111] p-5">
        <h1 className="font-display text-3xl font-black text-white">Dashboard Overview</h1>
        <p className="mt-1 text-sm text-zinc-300">Realtime snapshot of store performance.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-white/10 bg-[#181a23] p-4 transition hover:border-[#e10600]/45">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">Total Orders</p>
          <p className="mt-2 text-3xl font-black text-white">{data.totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#181a23] p-4 transition hover:border-[#e10600]/45">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">Pending Payments</p>
          <p className="mt-2 text-3xl font-black text-amber-400">{data.pendingPayments}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#181a23] p-4 transition hover:border-[#e10600]/45">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">Paid Revenue</p>
          <p className="mt-2 text-3xl font-black text-emerald-400">{formatCurrency(data.totalRevenue)}</p>
        </article>
        <article className="rounded-2xl border border-white/10 bg-[#181a23] p-4 transition hover:border-[#e10600]/45">
          <p className="text-xs uppercase tracking-[0.1em] text-zinc-400">Low Stock Alerts</p>
          <p className="mt-2 text-3xl font-black text-rose-400">{data.lowStockProducts.length}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#181a23] p-4">
        <h2 className="font-heading text-lg font-bold text-white">Low Stock Products</h2>

        {data.lowStockProducts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No low stock products.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-[#202332] px-3 py-2 text-sm"
              >
                <span className="font-semibold text-zinc-100">{product.name}</span>
                <span className="font-bold text-rose-400">{product.stock} left</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
