import { getAdminOrders } from "@/lib/queries";
import { OrdersClient } from "@/components/admin/orders-client";

export const metadata = {
  title: "Admin Orders",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-black text-white">Orders Management</h1>
        <p className="text-sm text-text-subtle">Manage and track customer orders here.</p>
      </div>

      <OrdersClient orders={orders} />
    </div>
  );
}
