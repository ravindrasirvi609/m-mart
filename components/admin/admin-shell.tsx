"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

interface AdminShellProps {
    children: React.ReactNode;
    user: {
        id: string;
        name?: string | null;
        email: string;
    };
    notificationState: {
        items: any[];
        notificationsAvailable: boolean;
    };
}

export function AdminShell({ children, user, notificationState }: AdminShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    // Close sidebar when route changes on mobile
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

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
