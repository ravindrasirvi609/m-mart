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
  LogOut,
  X,
  Upload,
  Megaphone,
  Image,
  FolderOpen,
  Tag,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/admin/ui/modal";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/bulk-upload", label: "Bulk Upload", icon: Upload },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/categories", label: "Categories", icon: Layers },
  { href: "/admin/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/collections", label: "Collections", icon: FolderOpen },
  { href: "/admin/product-tags", label: "Product Tags", icon: Tag },
  { href: "/admin/service-areas", label: "Service Areas", icon: MapPin },
  { href: "/admin/users", label: "Customers", icon: Users },
  { href: "/admin/delivery", label: "Delivery", icon: Truck },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-admin-border bg-sidebar transition-all duration-300 ease-in-out lg:static lg:z-auto",
          "w-[17rem] lg:w-64",
          isCollapsed && "lg:w-20",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-8 flex items-center justify-between px-2">
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-display text-xl font-black text-text-main">
                  Mmart
                </span>
                <span className="text-[10px] uppercase tracking-widest text-brand-red">
                  Admin Panel
                </span>
              </div>
            )}
            {isCollapsed && (
              <span className="font-display text-xl font-black text-brand-red">
                M
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden rounded-lg p-1.5 text-text-subtle hover:bg-white/10 hover:text-text-main lg:block"
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-text-subtle hover:bg-white/10 hover:text-text-main lg:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
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
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-brand-red/10 text-text-main shadow-[0_0_15px_rgba(225,6,0,0.1)]"
                      : "text-text-subtle hover:bg-white/5 hover:text-text-main",
                  )}
                >
                  <Icon
                    size={20}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive
                        ? "text-brand-red"
                        : "group-hover:text-text-main",
                    )}
                  />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-red shadow-[0_0_8px_#e10600]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-admin-border pt-4">
            <button
              onClick={() => setShowLogoutModal(true)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-subtle transition-all hover:bg-rose-500/10 hover:text-rose-500",
                isCollapsed && "justify-center",
              )}
            >
              <LogOut size={20} className="shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Logout Confirmation"
        description="Are you sure you want to logout? You will need to login again to access the admin panel."
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10">
            <div className="h-16 w-16 items-center justify-center flex rounded-full bg-rose-500/10 text-rose-500">
              <LogOut size={32} />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <form action="/auth/logout" method="post" className="flex-1">
              <Button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold h-11"
              >
                Logout Now
              </Button>
            </form>
            <Button
              variant="outline"
              onClick={() => setShowLogoutModal(false)}
              className="flex-1 border-admin-border hover:bg-white/5 text-text-main h-11"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
