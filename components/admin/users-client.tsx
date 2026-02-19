"use client";

import { User } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Badge } from "@/components/admin/ui/badge";
import { formatDate } from "@/lib/utils";

interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    created_at: string;
    role: "admin" | "customer";
}

interface UsersClientProps {
    users: AdminUser[];
}

export function UsersClient({ users }: UsersClientProps) {
    const columns = [
        {
            header: "Customer",
            accessorKey: "name",
            cell: (user: AdminUser) => (
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                        <User size={18} />
                    </div>
                    <div>
                        <p className="font-bold text-text-main">{user.name || "Guest"}</p>
                        <p className="text-[11px] text-text-subtle">{user.email}</p>
                    </div>
                </div>
            ),
        },
        {
            header: "Phone",
            accessorKey: "phone",
            cell: (user: AdminUser) => (
                <span className="text-xs text-text-subtle">{user.phone || "N/A"}</span>
            ),
        },
        {
            header: "Joined",
            accessorKey: "created_at",
            cell: (user: AdminUser) => (
                <span className="text-xs">{formatDate(user.created_at)}</span>
            ),
        },
        {
            header: "Role",
            accessorKey: "role",
            cell: (user: AdminUser) => (
                <Badge variant={user.role === "admin" ? "success" : "outline"}>
                    {user.role}
                </Badge>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="font-heading text-xl sm:text-2xl font-black text-text-main">Customers</h1>
                <p className="text-xs sm:text-sm text-text-subtle">View and manage registered customers.</p>
            </div>

            <DataTable
                data={users}
                columns={columns}
                searchKey="email"
            />
        </div>
    );
}
