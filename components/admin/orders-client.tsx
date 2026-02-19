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
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

interface OrdersClientProps {
  orders: AdminOrder[];
}

type OrderAddress = Database["public"]["Tables"]["orders"]["Row"]["delivery_address"];
type RealtimeOrderRow = Database["public"]["Tables"]["orders"]["Row"];

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

function getOrderUser(users: AdminOrder["users"]) {
  if (Array.isArray(users)) {
    return users[0] ?? null;
  }
  return users;
}

function getOrderItems(items: AdminOrder["order_items"]) {
  return Array.isArray(items) ? items : [];
}

function getOrderProduct(products: OrderItem["products"]) {
  if (Array.isArray(products)) {
    return products[0] ?? null;
  }
  return products;
}

function getAddressLabel(address: OrderAddress) {
  if (typeof address === "string") return address;
  if (address && typeof address === "object" && !Array.isArray(address) && "address" in address) {
    const value = address.address;
    return typeof value === "string" && value.trim().length > 0 ? value : "N/A";
  }
  return "N/A";
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const refreshTimerRef = useRef<number | null>(null);
  const liveOrdersRef = useRef<AdminOrder[]>(orders);
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, { payment_status: string; order_status: string }>
  >({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasRealtimeSession, setHasRealtimeSession] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const liveOrders = useMemo(() => {
    return orders.map((order) => {
      const override = statusOverrides[order.id];
      if (!override) {
        return order;
      }

      return {
        ...order,
        payment_status: override.payment_status,
        order_status: override.order_status,
      };
    });
  }, [orders, statusOverrides]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) {
      return null;
    }

    return liveOrders.find((entry) => entry.id === selectedOrderId) ?? null;
  }, [liveOrders, selectedOrderId]);

  useEffect(() => {
    liveOrdersRef.current = liveOrders;
  }, [liveOrders]);

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      setHasRealtimeSession(Boolean(data.session));
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasRealtimeSession(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const scheduleRefresh = useCallback(
    (delay = 220) => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = window.setTimeout(() => {
        refreshTimerRef.current = null;
        router.refresh();
      }, delay);
    },
    [router],
  );

  useEffect(() => {
    if (!hasRealtimeSession) {
      return;
    }

    const channel = supabase
      .channel("admin-orders-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const incoming = payload.new as RealtimeOrderRow;
          toast("New order received", {
            description: `Order #${incoming.id.slice(0, 8).toUpperCase()} was just placed.`,
          });
          scheduleRefresh(120);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const incoming = payload.new as RealtimeOrderRow;

          setStatusOverrides((current) => ({
            ...current,
            [incoming.id]: {
              payment_status: incoming.payment_status,
              order_status: incoming.order_status,
            },
          }));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeConnected(false);
        }
      });

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }

      void supabase.removeChannel(channel);
    };
  }, [hasRealtimeSession, scheduleRefresh, supabase]);

  const syncOrdersWithoutSocket = useCallback(async () => {
    if (!hasRealtimeSession) {
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id,payment_status,order_status")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[Admin Orders] Polling sync failed:", error.message);
      return;
    }

    const latest = data ?? [];
    const current = liveOrdersRef.current;
    const currentIds = new Set(current.map((entry) => entry.id));
    const hasUnknownOrder = latest.some((entry) => !currentIds.has(entry.id));

    if (hasUnknownOrder || latest.length !== current.length) {
      scheduleRefresh(80);
      return;
    }

    setStatusOverrides((currentOverrides) => {
      const nextOverrides = { ...currentOverrides };

      latest.forEach((entry) => {
        nextOverrides[entry.id] = {
          payment_status: entry.payment_status,
          order_status: entry.order_status,
        };
      });

      return nextOverrides;
    });
  }, [hasRealtimeSession, scheduleRefresh, supabase]);

  useEffect(() => {
    if (!hasRealtimeSession || realtimeConnected) {
      return;
    }

    const kickoff = window.setTimeout(() => {
      void syncOrdersWithoutSocket();
    }, 0);
    const timer = window.setInterval(() => {
      void syncOrdersWithoutSocket();
    }, 4500);

    return () => {
      window.clearTimeout(kickoff);
      window.clearInterval(timer);
    };
  }, [hasRealtimeSession, realtimeConnected, syncOrdersWithoutSocket]);

  const handleViewOrder = (order: AdminOrder) => {
    setSelectedOrderId(order.id);
    setIsModalOpen(true);
  };

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
                  {formatCurrency(
                    selectedOrder.total_amount - (selectedOrder.delivery_charge || 0),
                  )}
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
