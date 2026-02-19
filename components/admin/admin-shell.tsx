"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import type { Database } from "@/lib/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface AdminShellProps {
    children: React.ReactNode;
    user: {
        id: string;
        name?: string | null;
        email: string;
    };
    notificationState: {
        items: NotificationRow[];
        notificationsAvailable: boolean;
    };
}

export function AdminShell({ children, user, notificationState }: AdminShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-dashboard text-text-main dark">
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Navbar
                    user={user}
                    notificationState={notificationState}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-7xl animate-page-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
