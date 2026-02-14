"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { formatCurrency, formatOrderStatus } from "@/lib/utils";
import { StatusPill } from "@/components/ui/status-pill";

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    image_url: string;
  } | null;
};

type UserOrder = {
  id: string;
  created_at: string;
  total_amount: number;
  delivery_charge: number;
  payment_status: string;
  order_status: string;
  payment_screenshot_url: string | null;
  order_items: OrderItem[];
};

type OrderHistoryProps = {
  userId: string;
  initialOrders: UserOrder[];
};

export function OrderHistory({ userId, initialOrders }: OrderHistoryProps) {
  const [orders, setOrders] = useState(initialOrders);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const channel = supabase
      .channel(`orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new;
          setOrders((current) =>
            current.map((entry) =>
              entry.id === updated.id
                ? {
                    ...entry,
                    payment_status: String(updated.payment_status),
                    order_status: String(updated.order_status),
                  }
                : entry,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
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
            </div>

            <div className="flex items-center gap-2">
              <StatusPill status={order.payment_status} />
              <StatusPill status={order.order_status} />
            </div>
          </div>

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
                    {item.products?.name || "Unknown Product"}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Qty {item.quantity} • {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-zinc-200 pt-3 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
            <span>Status: {formatOrderStatus(order.order_status)}</span>
            <span>Total: {formatCurrency(order.total_amount)}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
