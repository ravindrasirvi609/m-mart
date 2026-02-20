"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Eye, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { Modal } from "@/components/admin/ui/modal";
import { UpdateOrderStatusForm } from "@/components/admin/update-order-status-form";
import { useRealtimeChannel } from "@/lib/hooks/use-realtime";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { RealtimePayload } from "@/lib/hooks/use-realtime";
import type { Database } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrdersClientProps {
  orders: AdminOrder[];
}

type OrderAddress = Database["public"]["Tables"]["orders"]["Row"]["delivery_address"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

interface OrderUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface OrderProduct {
  id?: string;
  name?: string | null;
  image_url?: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: OrderProduct | OrderProduct[] | null;
}

interface AdminOrder {
  id: string;
  created_at: string;
  total_amount: number;
  delivery_charge: number | null;
  payment_status: string;
  order_status: string;
  payment_screenshot_url: string | null;
  delivery_address: OrderAddress;
  users: OrderUser | OrderUser[] | null;
  order_items: OrderItem[] | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getOrderUser(users: AdminOrder["users"]) {
  return Array.isArray(users) ? users[0] ?? null : users;
}

function getOrderItems(items: AdminOrder["order_items"]) {
  return Array.isArray(items) ? items : [];
}

function getOrderProduct(products: OrderItem["products"]) {
  return Array.isArray(products) ? products[0] ?? null : products;
}

function getAddressLabel(address: OrderAddress) {
  if (typeof address === "string") return address;
  if (address && typeof address === "object" && !Array.isArray(address) && "address" in address) {
    const value = address.address;
    return typeof value === "string" && value.trim().length > 0 ? value : "N/A";
  }
  return "N/A";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function OrdersClient({ orders }: OrdersClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const liveOrdersRef = useRef<AdminOrder[]>(orders);

  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, { payment_status: string; order_status: string }>
  >({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { sendPush } = usePushNotifications();

  /* ----- Derived state ----- */
  const liveOrders = useMemo(() => {
    return orders.map((order) => {
      const override = statusOverrides[order.id];
      if (!override) return order;
      return { ...order, ...override };
    });
  }, [orders, statusOverrides]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return liveOrders.find((o) => o.id === selectedOrderId) ?? null;
  }, [liveOrders, selectedOrderId]);

  useEffect(() => {
    liveOrdersRef.current = liveOrders;
  }, [liveOrders]);

  /* ----- Realtime: listen to ALL order changes (no filter) ----- */
  const handleOrderChange = useCallback(
    (payload: RealtimePayload<"orders">) => {
      if (payload.eventType === "INSERT") {
        const incoming = payload.new as OrderRow;
        const orderId = incoming.id.slice(0, 8).toUpperCase();

        toast("🔔 New order received!", {
          description: `Order #${orderId} was just placed.`,
          duration: 8000,
        });

        void sendPush("New order received!", `Order #${orderId} was just placed.`, {
          tag: `admin-new-order-${incoming.id}`,
          url: "/admin/orders",
        });

        // Refresh the page data to load full order details
        router.refresh();
      }

      if (payload.eventType === "UPDATE") {
        const incoming = payload.new as OrderRow;
        setStatusOverrides((current) => ({
          ...current,
          [incoming.id]: {
            payment_status: incoming.payment_status,
            order_status: incoming.order_status,
          },
        }));
      }
    },
    [router, sendPush],
  );

  useRealtimeChannel({
    channelName: "admin-orders-live",
    table: "orders",
    event: "*",
    onPayload: handleOrderChange,
  });

  /* ----- Polling backup: 30s safety net ----- */
  const syncOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id,payment_status,order_status")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("[Admin Orders] Poll failed:", error.message);
        return;
      }

      const latest = data ?? [];
      const current = liveOrdersRef.current;
      const currentIds = new Set(current.map((o) => o.id));
      const hasNewOrder = latest.some((o) => !currentIds.has(o.id));

      if (hasNewOrder || latest.length !== current.length) {
        router.refresh();
        return;
      }

      setStatusOverrides((prev) => {
        const next = { ...prev };
        latest.forEach((o) => {
          next[o.id] = {
            payment_status: o.payment_status,
            order_status: o.order_status,
          };
        });
        return next;
      });
    } catch {
      // Silently ignore
    }
  }, [router, supabase]);

  useEffect(() => {
    const kickoff = setTimeout(() => void syncOrders(), 2000);
    const timer = setInterval(() => void syncOrders(), 30000);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [syncOrders]);

  /* ----- Handlers ----- */
  const handleViewOrder = (order: AdminOrder) => {
    setSelectedOrderId(order.id);
    setIsModalOpen(true);
  };

  /* ----- Table columns ----- */
  const columns = [
    {
      header: "Order ID",
      accessorKey: "id",
      cell: (order: AdminOrder) => (
        <span className="font-mono text-xs font-bold text-text-main">
          #{order.id.split("-")[0]}
        </span>
      ),
    },
    {
      header: "Customer",
      accessorKey: "users",
      cell: (order: AdminOrder) => {
        const user = getOrderUser(order.users);
        return (
          <div>
            <p className="font-bold text-text-main">{user?.name || "Guest"}</p>
            <p className="text-[11px] text-text-subtle">{user?.email}</p>
          </div>
        );
      },
    },
    {
      header: "Date",
      accessorKey: "created_at",
      cell: (order: AdminOrder) => <span className="text-xs">{formatDate(order.created_at)}</span>,
    },
    {
      header: "Total",
      accessorKey: "total_amount",
      cell: (order: AdminOrder) => (
        <span className="font-bold text-text-main">{formatCurrency(order.total_amount)}</span>
      ),
    },
    {
      header: "Payment",
      accessorKey: "payment_status",
      cell: (order: AdminOrder) => (
        <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
          {order.payment_status.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      header: "Status",
      accessorKey: "order_status",
      cell: (order: AdminOrder) => (
        <Badge variant={order.order_status === "delivered" ? "success" : "warning"}>
          {order.order_status}
        </Badge>
      ),
    },
  ];

  const orderItems = selectedOrder ? getOrderItems(selectedOrder.order_items) : [];
  const selectedOrderUser = selectedOrder ? getOrderUser(selectedOrder.users) : null;

  /* ----- Render ----- */
  return (
    <>
      <DataTable
        data={liveOrders}
        columns={columns}
        searchKey="id"
        isLoading={false}
        onAction={handleViewOrder}
        renderActions={(order) => (
          <button
            onClick={() => handleViewOrder(order)}
            className="rounded-lg p-2 text-text-subtle hover:bg-white/10 hover:text-text-main transition-colors"
            aria-label="View order details"
          >
            <Eye size={18} />
          </button>
        )}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Order Details"
        description={selectedOrder ? `#${selectedOrder.id}` : ""}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  Customer Info
                </p>
                <p className="font-bold text-text-main">{selectedOrderUser?.name || "N/A"}</p>
                <p className="text-xs text-text-subtle">{selectedOrderUser?.email}</p>
                <p className="text-xs text-text-subtle">{selectedOrderUser?.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  Shipping Address
                </p>
                <p className="text-xs leading-relaxed text-text-main">
                  {getAddressLabel(selectedOrder.delivery_address)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                Items
              </p>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {orderItems.map((item) => {
                  const itemProduct = getOrderProduct(item.products);
                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-admin-border bg-white/[0.02] p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={itemProduct?.image_url || "/placeholder.jpg"}
                            alt={itemProduct?.name || "Product"}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-text-main">
                            {itemProduct?.name || "Unnamed product"}
                          </p>
                          <p className="text-[11px] text-text-subtle">
                            Qty: {item.quantity} x {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-right text-sm font-bold text-text-main">
                        {formatCurrency(item.quantity * item.price)}
                      </p>
                    </div>
                  );
                })}
                {orderItems.length === 0 && (
                  <p className="rounded-xl border border-admin-border bg-white/[0.02] p-3 text-xs text-text-subtle">
                    No order items found for this order.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-admin-border bg-white/[0.02] p-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-subtle">Subtotal</span>
                <span className="font-bold text-text-main">
                  {formatCurrency(selectedOrder.total_amount - (selectedOrder.delivery_charge || 0))}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-text-subtle">Delivery</span>
                <span className="font-bold text-text-main">
                  {formatCurrency(selectedOrder.delivery_charge || 0)}
                </span>
              </div>
              <div className="mt-2 flex justify-between border-t border-admin-border pt-2">
                <span className="font-bold text-text-main">Total</span>
                <span className="text-lg font-black text-brand-red">
                  {formatCurrency(selectedOrder.total_amount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                Actions
              </p>
              {selectedOrder.payment_screenshot_url && (
                <a
                  href={selectedOrder.payment_screenshot_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-admin-border p-3 text-xs font-bold text-text-main transition-colors hover:bg-white/5"
                >
                  <ExternalLink size={16} />
                  View Payment Screenshot
                </a>
              )}
              <div className="rounded-2xl border border-admin-border bg-white/[0.02] p-4">
                <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  Update Status
                </p>
                <UpdateOrderStatusForm
                  key={`${selectedOrder.id}-${selectedOrder.payment_status}-${selectedOrder.order_status}`}
                  orderId={selectedOrder.id}
                  paymentStatus={selectedOrder.payment_status}
                  orderStatus={selectedOrder.order_status}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
