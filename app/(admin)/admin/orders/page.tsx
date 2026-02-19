import { getAdminOrders } from "@/lib/queries";
import { OrdersClient } from "@/components/admin/orders-client";

export const metadata = {
  title: "Admin Orders",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-xl sm:text-2xl font-black text-text-main">Orders Management</h1>
        <p className="text-xs sm:text-sm text-text-subtle">Manage and track customer orders here.</p>
      </div>

      <OrdersClient orders={orders} />
    </div>
  );
}
