import { OrderHistory } from "@/components/store/order-history";
import { requireUser } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries";

export const metadata = {
  title: "My Orders",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Order History</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Order statuses update in real-time when admin changes them.
      </p>
      <OrderHistory userId={user.id} initialOrders={orders as never} />
    </div>
  );
}
