import { OrderHistory } from "@/components/store/order-history";
import { Reveal } from "@/components/ui/reveal";
import { requireUser } from "@/lib/auth";
import { getUserOrders } from "@/lib/queries";

export const metadata = {
  title: "My Orders",
};

export default async function OrdersPage() {
  const user = await requireUser("/orders");
  const orders = await getUserOrders(user.id);

  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5 sm:p-6">
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Order History</h1>
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Track payment and delivery status in real-time.
          </p>
        </section>
      </Reveal>
      <OrderHistory userId={user.id} initialOrders={orders as never} />
    </div>
  );
}
