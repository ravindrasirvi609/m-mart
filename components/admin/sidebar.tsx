"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Layers, 
  Users, 
  Truck, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-admin-border bg-sidebar transition-all duration-300 ease-in-out lg:static",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div className="flex h-full flex-col p-4">
        <div className="mb-8 flex items-center justify-between px-2">
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="font-display text-xl font-black text-white">Mmart</span>
              <span className="text-[10px] uppercase tracking-widest text-brand-red">Admin Panel</span>
            </div>
          )}
          {isCollapsed && (
            <span className="font-display text-xl font-black text-brand-red">M</span>
          )}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden rounded-lg p-1.5 text-text-subtle hover:bg-white/10 lg:block"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "bg-brand-red/10 text-white shadow-[0_0_15px_rgba(225,6,0,0.1)]" 
                    : "text-text-subtle hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon 
                  size={20} 
                  className={cn(
                    "shrink-0 transition-colors",
                    isActive ? "text-brand-red" : "group-hover:text-white"
                  )} 
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-red shadow-[0_0_8px_#e10600]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-admin-border pt-4">
          <button className={cn(
            "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-subtle transition-all hover:bg-rose-500/10 hover:text-rose-500",
            isCollapsed && "justify-center"
          )}>
            <LogOut size={20} className="shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
