"use client";

import { Search, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { NotificationCenter } from "@/components/notifications/notification-center";
import type { Database } from "@/lib/supabase/types";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

interface NavbarProps {
    user: {
        id: string;
        name?: string | null;
        email: string;
    };
    notificationState: {
        items: NotificationRow[];
        notificationsAvailable: boolean;
    };
    onMenuClick?: () => void;
}

export function Navbar({ user, notificationState, onMenuClick }: NavbarProps) {
    const pathname = usePathname();

    // Basic breadcrumb logic
    const segments = pathname.split("/").filter(Boolean);
    const breadcrumbs = segments.map((s, i) => ({
        label: s.charAt(0).toUpperCase() + s.slice(1),
        href: "/" + segments.slice(0, i + 1).join("/"),
    }));

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-admin-border bg-dashboard/80 px-4 backdrop-blur-md lg:px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-text-subtle hover:text-text-main lg:hidden"
                    aria-label="Open menu"
                >
                    <Menu size={20} />
                </button>

                <p className="text-sm font-semibold text-text-main sm:hidden">
                    {breadcrumbs[breadcrumbs.length - 1]?.label || "Admin"}
                </p>

                <nav className="hidden items-center text-sm font-medium text-text-subtle sm:flex">
                    {breadcrumbs.map((crumb, i) => (
                        <div key={crumb.href} className="flex items-center">
                            {i > 0 && <span className="mx-2 text-white/20">/</span>}
                            <span className={i === breadcrumbs.length - 1 ? "text-text-main" : ""}>
                                {crumb.label}
                            </span>
                        </div>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" size={16} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-64 rounded-xl border border-admin-border bg-white/5 pl-9 pr-4 text-sm text-text-main placeholder:text-text-subtle focus:border-brand-red/50 focus:outline-none focus:ring-1 focus:ring-brand-red/50 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <NotificationCenter
                        mode="admin"
                        userId={user.id}
                        initialNotifications={notificationState.items}
                        notificationsAvailable={notificationState.notificationsAvailable}
                    />

                    <div className="h-8 w-[1px] bg-admin-border mx-1 hidden sm:block" />

                    <button className="flex items-center gap-2 rounded-full border border-admin-border bg-white/5 p-1 pr-3 hover:bg-white/10 transition-colors">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-red text-[11px] font-bold text-white uppercase">
                            {user.name?.[0] || user.email[0]}
                        </div>
                        <div className="hidden text-left sm:block">
                            <p className="text-[11px] font-bold text-text-main line-clamp-1 leading-tight">
                                {user.name || "Admin"}
                            </p>
                            <p className="text-[9px] text-text-subtle line-clamp-1 leading-tight">
                                Super Admin
                            </p>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
}
