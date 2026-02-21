"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useRealtimeChannel } from "@/lib/hooks/use-realtime";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { RealtimePayload } from "@/lib/hooks/use-realtime";
import type { Database } from "@/lib/supabase/types";
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

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type OrderHistoryProps = {
  userId: string;
  initialOrders: UserOrder[];
};

export function OrderHistory({ userId, initialOrders }: OrderHistoryProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [orders, setOrders] = useState(initialOrders);
  const ordersRef = useRef(initialOrders);

  const { sendPush } = usePushNotifications();

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  const handleOrderChange = useCallback(
    (payload: RealtimePayload<"orders">) => {
      if (payload.eventType === "INSERT") {
        const incoming = payload.new as OrderRow;

        if (incoming.user_id !== userId) return;

        toast("Order placed! ✓", {
          description: `Order #${incoming.id.slice(0, 8).toUpperCase()} is now in your history.`,
        });

        void sendPush(
          "Order placed!",
          `Order #${incoming.id.slice(0, 8).toUpperCase()} has been placed successfully.`,
          { tag: `order-placed-${incoming.id}`, url: "/orders" },
        );

        router.refresh();
      }

      if (payload.eventType === "UPDATE") {
        const updated = payload.new as OrderRow;

        if (updated.user_id !== userId) return;

        const previous = ordersRef.current.find((o) => o.id === updated.id);
        const nextOrderStatus = String(updated.order_status);
        const nextPaymentStatus = String(updated.payment_status);

        if (!previous) {
          router.refresh();
          return;
        }

        if (
          previous.order_status !== nextOrderStatus ||
          previous.payment_status !== nextPaymentStatus
        ) {
          const statusMsg = `Order #${updated.id.slice(0, 8).toUpperCase()} is ${formatOrderStatus(nextOrderStatus)}.`;

          toast("Order status updated", { description: statusMsg });

          void sendPush("Order status updated", statusMsg, {
            tag: `order-update-${updated.id}-${nextOrderStatus}`,
            url: "/orders",
          });
        }

        setOrders((current) =>
          current.map((o) =>
            o.id === updated.id
              ? { ...o, payment_status: nextPaymentStatus, order_status: nextOrderStatus }
              : o,
          ),
        );
      }
    },
    [router, sendPush, userId],
  );

  useRealtimeChannel({
    channelName: `customer-orders-${userId}`,
    table: "orders",
    event: "*",
    onPayload: handleOrderChange,
  });

  const syncOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id,payment_status,order_status")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(25);

      if (error) {
        console.error("[Orders] Poll failed:", error.message);
        return;
      }

      const latest = data ?? [];
      const current = ordersRef.current;
      const currentIds = new Set(current.map((o) => o.id));
      const hasNew = latest.some((o) => !currentIds.has(o.id));

      if (hasNew || latest.length !== current.length) {
        router.refresh();
        return;
      }

      setOrders((entries) =>
        entries.map((entry) => {
          const incoming = latest.find((o) => o.id === entry.id);
          if (!incoming) return entry;
          return {
            ...entry,
            payment_status: incoming.payment_status,
            order_status: incoming.order_status,
          };
        }),
      );
    } catch {
      // Silently ignore
    }
  }, [router, supabase, userId]);

  useEffect(() => {
    const kickoff = setTimeout(() => void syncOrders(), 2000);
    const timer = setInterval(() => void syncOrders(), 30000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [syncOrders]);

  if (orders.length === 0) {
    return (
      <div className="premium-card border-dashed p-10 text-center">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order, index) => (
        <article
          key={order.id}
          className="animate-slide-in premium-card space-y-4 p-4"
          style={{ animationDelay: `${index * 70}ms` }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.07em] text-zinc-900 dark:text-zinc-100">
                Order #{order.id.slice(0, 8)}
              </p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-300">
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
              <div key={item.id} className="flex items-center gap-3 rounded-xl bg-[#fff4ef] p-2 dark:bg-zinc-800">
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
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.products?.name || "Unknown Product"}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300">
                    Qty {item.quantity} • {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between border-t border-[#c91510]/16 pt-3 text-sm font-bold text-zinc-700 dark:text-zinc-200">
            <span>Status: {formatOrderStatus(order.order_status)}</span>
            <span className="text-[#c91510]">Total: {formatCurrency(order.total_amount)}</span>
          </div>
        </article>
      ))}

    </div>
  );
}
