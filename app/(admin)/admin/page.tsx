import { ShoppingBag, DollarSign, Users, AlertTriangle, Clock, ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { getAdminDashboardData } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatsCard } from "@/components/admin/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";

export const metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-black text-white">Dashboard Dashboard</h1>
        <p className="text-sm text-text-subtle">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(data.totalRevenue)}
          icon={DollarSign}
          color="green"
          trend={{ value: 12, isUp: true }}
          description="Total paid orders"
        />
        <StatsCard
          title="Total Orders"
          value={data.totalOrders}
          icon={ShoppingBag}
          color="blue"
          trend={{ value: 8, isUp: true }}
          description="Across all platforms"
        />
        <StatsCard
          title="Total Customers"
          value={data.totalCustomers}
          icon={Users}
          color="amber"
          trend={{ value: 5, isUp: true }}
          description="Registered users"
        />
        <StatsCard
          title="Low Stock Alerts"
          value={data.lowStockProducts.length}
          icon={AlertTriangle}
          color="rose"
          description="Products below threshold"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} className="text-brand-red" />
              Recent Orders
            </CardTitle>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-brand-red hover:underline flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-admin-border bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold text-white uppercase text-[10px]">Order ID</th>
                    <th className="px-6 py-4 font-bold text-white uppercase text-[10px]">Customer</th>
                    <th className="px-6 py-4 font-bold text-white uppercase text-[10px]">Status</th>
                    <th className="px-6 py-4 font-bold text-white uppercase text-[10px] text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {data.recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-text-subtle italic">No recent orders.</td>
                    </tr>
                  ) : (
                    data.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px] text-text-subtle">
                          #{order.id.split("-")[0]}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-white">{order.user?.name || "Guest"}</p>
                          <p className="text-[11px] text-text-subtle">{order.user?.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={order.order_status === "delivered" ? "success" : "warning"}>
                            {order.order_status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-white">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-rose-400" />
              Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-500/10 p-3 text-emerald-500">
                  <ShoppingBag size={24} />
                </div>
                <p className="mt-3 text-sm font-medium text-text-subtle">Inventory is healthy!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-xl border border-admin-border bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-white">{product.name}</p>
                      <p className="text-[11px] text-text-subtle">ID: {product.id.split("-")[0]}</p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="text-xs font-black text-rose-400">{product.stock} left</p>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-[10px] font-bold text-brand-red hover:underline"
                      >
                        Restock
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
