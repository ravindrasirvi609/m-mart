import Image from "next/image";

import { UpdateOrderStatusForm } from "@/components/admin/update-order-status-form";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminOrders } from "@/lib/queries";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Admin Orders",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const deliveryAddress =
          typeof order.delivery_address === "object" &&
            order.delivery_address !== null &&
            "address" in order.delivery_address
            ? String(order.delivery_address.address)
            : "-";

        return (
          <article
            key={order.id}
            className="rounded-2xl border border-white/10 bg-[#181a23] p-4"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.08em] text-zinc-100">
                    Order #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {new Date(order.created_at).toLocaleString("en-IN")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-300">
                    Customer: {order.users?.name || "-"} ({order.users?.email || "-"})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <StatusPill status={order.payment_status} />
                  <StatusPill status={order.order_status} />
                </div>
              </div>

              <p className="text-sm text-zinc-300">Delivery address: {deliveryAddress}</p>

              <div className="grid gap-3 sm:grid-cols-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#202332] p-2">
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-zinc-800">
                      <Image
                        src={item.products?.image_url || "/placeholder-product.svg"}
                        alt={item.products?.name || "Product"}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {item.products?.name || "Product"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        Qty {item.quantity} • {formatCurrency(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {order.payment_screenshot_url ? (
                <a
                  href={order.payment_screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex text-xs font-bold uppercase tracking-[0.1em] text-[#ff6d67] underline"
                >
                  View payment screenshot
                </a>
              ) : (
                <p className="text-xs text-zinc-500">No payment screenshot uploaded.</p>
              )}

              <UpdateOrderStatusForm
                orderId={order.id}
                paymentStatus={order.payment_status}
                orderStatus={order.order_status}
              />

              <p className="text-right text-sm font-bold text-[#ff6d67]">
                Total: {formatCurrency(order.total_amount)}
              </p>
            </div>
          </article>
        );
      })}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-sm text-zinc-300">
          No orders found.
        </div>
      ) : null}
    </div>
  );
}
