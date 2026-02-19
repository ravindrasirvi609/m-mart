"use client";

import { useState } from "react";
import Image from "next/image";
import { Eye, ExternalLink } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { Modal } from "@/components/admin/ui/modal";
import { UpdateOrderStatusForm } from "@/components/admin/update-order-status-form";

interface OrdersClientProps {
  orders: AdminOrder[];
}

interface OrderUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface OrderProduct {
  id: string;
  name: string;
  image_url: string | null;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: OrderProduct | null;
}

interface AdminOrder {
  id: string;
  created_at: string;
  total_amount: number;
  delivery_charge: number | null;
  payment_status: string;
  order_status: string;
  payment_screenshot_url: string | null;
  delivery_address: string | { address?: string } | null;
  users: OrderUser | null;
  order_items: OrderItem[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewOrder = (order: AdminOrder) => {
    setSelectedOrder(order);
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
      cell: (order: AdminOrder) => (
        <div>
          <p className="font-bold text-text-main">{order.users?.name || "Guest"}</p>
          <p className="text-[11px] text-text-subtle">{order.users?.email}</p>
        </div>
      ),
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

  const orderItems = selectedOrder?.order_items ?? [];

  return (
    <>
      <DataTable
        data={orders}
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
                <p className="font-bold text-text-main">{selectedOrder.users?.name || "N/A"}</p>
                <p className="text-xs text-text-subtle">{selectedOrder.users?.email}</p>
                <p className="text-xs text-text-subtle">{selectedOrder.users?.phone}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  Shipping Address
                </p>
                <p className="text-xs leading-relaxed text-text-main">
                  {typeof selectedOrder.delivery_address === "object"
                    ? selectedOrder.delivery_address.address
                    : selectedOrder.delivery_address}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                Items
              </p>
              <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                {orderItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-admin-border bg-white/[0.02] p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={item.products?.image_url || "/placeholder.jpg"}
                          alt={item.products?.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-text-main">
                          {item.products?.name}
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
                ))}
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
