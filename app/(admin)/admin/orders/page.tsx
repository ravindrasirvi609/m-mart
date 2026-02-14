import Image from "next/image";

import { updateOrderStatusAction } from "@/actions/admin-actions";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusPill } from "@/components/ui/status-pill";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/lib/constants";
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
            className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Order #{order.id.slice(0, 8)}
                </p>
                <p className="text-xs text-zinc-500">
                  {new Date(order.created_at).toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
                  Customer: {order.users?.name || "-"} ({order.users?.email || "-"})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StatusPill status={order.payment_status} />
                <StatusPill status={order.order_status} />
              </div>
            </div>

            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Delivery address: {deliveryAddress}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-2 dark:bg-zinc-800">
                  <div className="relative h-14 w-14 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-700">
                    <Image
                      src={item.products?.image_url || "/placeholder-product.svg"}
                      alt={item.products?.name || "Product"}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {item.products?.name || "Product"}
                    </p>
                    <p className="text-xs text-zinc-500">
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
                className="inline-flex text-sm font-semibold text-emerald-700 underline"
              >
                View payment screenshot
              </a>
            ) : (
              <p className="text-xs text-zinc-500">No payment screenshot uploaded.</p>
            )}

            <form action={updateOrderStatusAction} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="order_id" value={order.id} />

              <Select name="payment_status" defaultValue={order.payment_status}>
                {PAYMENT_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>

              <Select name="order_status" defaultValue={order.order_status}>
                {ORDER_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>

              <Button type="submit">Update Status</Button>
            </form>

            <p className="text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Total: {formatCurrency(order.total_amount)}
            </p>
          </article>
        );
      })}

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
          No orders found.
        </div>
      ) : null}
    </div>
  );
}
