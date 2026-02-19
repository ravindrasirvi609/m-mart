"use client";

import { Truck, CheckCircle, Clock } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { formatDate } from "@/lib/utils";

interface DeliveryOrder {
    id: string;
    created_at: string;
    order_status: string;
    users: {
        name: string | null;
        phone: string | null;
    } | null;
    delivery_address: string | { address?: string } | null;
}

interface DeliveryClientProps {
    orders: DeliveryOrder[];
}

export function DeliveryClient({ orders }: DeliveryClientProps) {
    // Filter for orders related to delivery
    const deliveryOrders = orders.filter(
        (order) => order.order_status === "out_for_delivery" || order.order_status === "delivered" || order.order_status === "preparing"
    );

    const columns = [
        {
            header: "Order ID",
            accessorKey: "id",
            cell: (order: DeliveryOrder) => (
                <span className="font-mono text-xs font-bold text-text-main">
                    #{order.id.split("-")[0]}
                </span>
            ),
        },
        {
            header: "Customer",
            accessorKey: "users",
            cell: (order: DeliveryOrder) => (
                <div>
                    <p className="font-bold text-text-main">{order.users?.name || "Guest"}</p>
                    <p className="text-[10px] text-text-subtle truncate max-w-[150px]">{order.users?.phone}</p>
                </div>
            ),
        },
        {
            header: "Address",
            accessorKey: "delivery_address",
            cell: (order: DeliveryOrder) => (
                <span className="text-[11px] text-text-subtle truncate max-w-[200px] block">
                    {typeof order.delivery_address === 'object' ? order.delivery_address.address : order.delivery_address}
                </span>
            ),
        },
        {
            header: "Status",
            accessorKey: "order_status",
            cell: (order: DeliveryOrder) => {
                let variant: "warning" | "success" | "outline" = "outline";
                let Icon = Clock;

                if (order.order_status === "delivered") {
                    variant = "success";
                    Icon = CheckCircle;
                } else if (order.order_status === "out_for_delivery") {
                    variant = "warning";
                    Icon = Truck;
                }

                return (
                    <Badge variant={variant} className="flex w-fit items-center gap-1.5">
                        <Icon size={12} />
                        {order.order_status.replace(/_/g, " ")}
                    </Badge>
                );
            },
        },
        {
            header: "Date",
            accessorKey: "created_at",
            cell: (order: DeliveryOrder) => (
                <span className="text-xs">{formatDate(order.created_at)}</span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="font-heading text-xl sm:text-2xl font-black text-text-main">Delivery Management</h1>
                <p className="text-xs sm:text-sm text-text-subtle">Monitor active shipments and delivery performance.</p>
            </div>

            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Preparing</p>
                    <p className="mt-2 text-2xl font-black text-text-main">
                        {orders.filter(o => o.order_status === 'preparing').length}
                    </p>
                </div>
                <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Out for Delivery</p>
                    <p className="mt-2 text-2xl font-black text-amber-500">
                        {orders.filter(o => o.order_status === 'out_for_delivery').length}
                    </p>
                </div>
                <div className="rounded-2xl border border-admin-border bg-admin-card p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">Delivered Today</p>
                    <p className="mt-2 text-2xl font-black text-emerald-500">
                        {orders.filter(o => o.order_status === 'delivered').length}
                    </p>
                </div>
            </div>

            <DataTable
                data={deliveryOrders}
                columns={columns}
                searchKey="id"
            />
        </div>
    );
}
