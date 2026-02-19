"use client";

import { Truck, CheckCircle, Clock } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type OrderAddress = Database["public"]["Tables"]["orders"]["Row"]["delivery_address"];

type OrderUser =
    | {
          name?: string | null;
          phone?: string | null;
      }
    | Array<{
          name?: string | null;
          phone?: string | null;
      }>
    | null;

function getOrderUser(users: OrderUser) {
    if (Array.isArray(users)) {
        return users[0] ?? null;
    }
    return users;
}

function getAddressLabel(address: OrderAddress) {
    if (typeof address === "string") return address;
    if (address && typeof address === "object" && !Array.isArray(address) && "address" in address) {
        const value = address.address;
        return typeof value === "string" && value.trim().length > 0 ? value : "N/A";
    }
    return "N/A";
}

interface DeliveryOrder {
    id: string;
    created_at: string;
    order_status: string;
    users: OrderUser;
    delivery_address: OrderAddress;
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
            cell: (order: DeliveryOrder) => {
                const user = getOrderUser(order.users);
                return (
                    <div>
                        <p className="font-bold text-text-main">{user?.name || "Guest"}</p>
                        <p className="text-[10px] text-text-subtle truncate max-w-[150px]">{user?.phone}</p>
                    </div>
                );
            },
        },
        {
            header: "Address",
            accessorKey: "delivery_address",
            cell: (order: DeliveryOrder) => (
                <span className="text-[11px] text-text-subtle truncate max-w-[200px] block">
                    {getAddressLabel(order.delivery_address)}
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
