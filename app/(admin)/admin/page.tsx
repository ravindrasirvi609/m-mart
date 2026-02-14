import { getAdminDashboardData } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-4">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Total Orders</p>
          <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{data.totalOrders}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Pending Payments</p>
          <p className="text-2xl font-semibold text-amber-700">{data.pendingPayments}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Total Revenue (Paid)</p>
          <p className="text-2xl font-semibold text-emerald-700">
            {formatCurrency(data.totalRevenue)}
          </p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs text-zinc-500">Low Stock Alerts</p>
          <p className="text-2xl font-semibold text-rose-700">{data.lowStockProducts.length}</p>
        </article>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Low Stock Products</h2>

        {data.lowStockProducts.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">No low stock products.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {data.lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2 text-sm dark:bg-zinc-800"
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-rose-700">{product.stock} left</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
