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
    orders: any[];
}

export function OrdersClient({ orders }: OrdersClientProps) {
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleViewOrder = (order: any) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const columns = [
        {
            header: "Order ID",
            accessorKey: "id",
            cell: (order: any) => (
                <span className="font-mono text-xs font-bold text-text-main">
                    #{order.id.split("-")[0]}
                </span>
            ),
        },
        {
            header: "Customer",
            accessorKey: "users",
            cell: (order: any) => (
                <div>
                    <p className="font-bold text-text-main">{order.users?.name || "Guest"}</p>
                    <p className="text-[11px] text-text-subtle">{order.users?.email}</p>
                </div>
            ),
        },
        {
            header: "Date",
            accessorKey: "created_at",
            cell: (order: any) => (
                <span className="text-xs">{formatDate(order.created_at)}</span>
            ),
        },
        {
            header: "Total",
            accessorKey: "total_amount",
            cell: (order: any) => (
                <span className="font-bold text-text-main">{formatCurrency(order.total_amount)}</span>
            ),
        },
        {
            header: "Payment",
            accessorKey: "payment_status",
            cell: (order: any) => (
                <Badge variant={order.payment_status === "paid" ? "success" : "warning"}>
                    {order.payment_status.replace(/_/g, " ")}
                </Badge>
            ),
        },
        {
            header: "Status",
            accessorKey: "order_status",
            cell: (order: any) => (
                <Badge variant={order.order_status === "delivered" ? "success" : "warning"}>
                    {order.order_status}
                </Badge>
            ),
        },
    ];

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
                    >
                        <Eye size={18} />
                    </button>
                )}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Order Details`}
                description={selectedOrder ? `#${selectedOrder.id}` : ""}
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Customer Info</p>
                                <p className="font-bold text-text-main">{selectedOrder.users?.name || "N/A"}</p>
                                <p className="text-xs text-text-subtle">{selectedOrder.users?.email}</p>
                                <p className="text-xs text-text-subtle">{selectedOrder.users?.phone}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Shipping Address</p>
                                <p className="text-xs text-text-main leading-relaxed">
                                    {typeof selectedOrder.delivery_address === 'object'
                                        ? selectedOrder.delivery_address.address
                                        : selectedOrder.delivery_address}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Items</p>
                            <div className="max-h-60 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                                {selectedOrder.order_items.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-admin-border bg-white/[0.02] p-2">
                                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                                            <Image
                                                src={item.products?.image_url || "/placeholder.jpg"}
                                                alt={item.products?.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-text-main">{item.products?.name}</p>
                                            <p className="text-[11px] text-text-subtle">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                                        </div>
                                        <p className="text-sm font-bold text-text-main">{formatCurrency(item.quantity * item.price)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-admin-border bg-white/[0.02] p-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-subtle">Subtotal</span>
                                <span className="font-bold text-text-main">{formatCurrency(selectedOrder.total_amount - (selectedOrder.delivery_charge || 0))}</span>
                            </div>
                            <div className="mt-1 flex justify-between text-sm">
                                <span className="text-text-subtle">Delivery</span>
                                <span className="font-bold text-text-main">{formatCurrency(selectedOrder.delivery_charge || 0)}</span>
                            </div>
                            <div className="mt-2 flex justify-between border-t border-admin-border pt-2">
                                <span className="font-bold text-text-main">Total</span>
                                <span className="text-lg font-black text-brand-red">{formatCurrency(selectedOrder.total_amount)}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Actions</p>
                            {selectedOrder.payment_screenshot_url && (
                                <a
                                    href={selectedOrder.payment_screenshot_url}
                                    target="_blank"
                                    className="flex items-center justify-center gap-2 rounded-xl border border-admin-border p-3 text-xs font-bold text-text-main hover:bg-white/5 transition-colors"
                                >
                                    <ExternalLink size={16} />
                                    View Payment Screenshot
                                </a>
                            )}
                            <div className="p-4 rounded-2xl border border-admin-border bg-white/[0.02]">
                                <p className="mb-4 text-[10px] font-bold uppercase tracking-wider text-text-subtle text-center">Update Status</p>
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

            {/* Override the actions button in DataTable to trigger modal */}
            <style jsx global>{`
        tr.group button { 
          /* We'll use a custom accessor or method to replace the default action button if needed, 
             but for now let’s just add an Eye button to each row. */
        }
      `}</style>
        </>
    );
}
