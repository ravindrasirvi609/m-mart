"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MapPin,
  Menu,
  Moon,
  Phone,
  ShoppingCart,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";

import { NotificationCenter } from "@/components/notifications/notification-center";
import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/constants";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type MainHeaderProps = {
  isAdmin: boolean;
  isLoggedIn: boolean;
  userId: string | null;
  initialNotifications: NotificationRow[];
  notificationsAvailable: boolean;
  /** User's current delivery area name */
  deliveryArea?: string;
  /** User's current delivery city */
  deliveryCity?: string;
};

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/profile", label: "Profile" },
];

function linkIsActive(pathname: string, href: string) {
  return href === "/"
    ? pathname === "/"
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function MainHeader({
  isAdmin,
  isLoggedIn,
  userId,
  initialNotifications,
  notificationsAvailable,
  deliveryArea,
  deliveryCity,
}: MainHeaderProps) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  const links = isAdmin
    ? [...baseLinks, { href: "/admin", label: "Admin" }]
    : baseLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-[#d71b15]/10 bg-white/92 backdrop-blur-xl dark:border-zinc-700/40 dark:bg-[#0c1118]/92">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 lg:px-8">
        <Link href="/" className="group flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff6a3f] to-[#c91510] text-xs font-extrabold text-white shadow-[0_8px_18px_rgba(201,21,16,0.3)] transition group-hover:scale-[1.03] sm:h-10 sm:w-10 sm:text-sm">
            MM
          </div>
          <div className="hidden sm:block">
            <p className="font-heading text-sm font-bold tracking-tight text-text-main sm:text-base">
              {STORE.name}
            </p>
            <p className="text-[10px] font-medium text-text-subtle sm:text-xs">
              Quick grocery delivery
            </p>
          </div>
        </Link>

        {/* Delivery area indicator */}
        {deliveryArea && (
          <div className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-[11px] font-bold text-emerald-700 sm:flex dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-400">
            <MapPin size={11} />
            <span className="max-w-[100px] truncate">{deliveryArea}</span>
            {deliveryCity && (
              <span className="text-[10px] font-medium text-emerald-600/70 dark:text-emerald-500/60">
                , {deliveryCity}
              </span>
            )}
          </div>
        )}

        <nav className="hidden items-center gap-1 rounded-full border border-[#d71b15]/10 bg-surface-elevated/80 p-1 shadow-sm md:flex">
          {links.map((link) => {
            const active = linkIsActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-extrabold tracking-wide transition",
                  active
                    ? "bg-gradient-to-r from-[#f65636] to-[#c91510] text-white shadow-[0_6px_14px_rgba(201,21,16,0.22)]"
                    : "text-text-subtle hover:bg-[#fff1ed] hover:text-[#c91510] dark:hover:bg-zinc-800",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${STORE.phone}`}
            className="hidden items-center gap-1 rounded-full border border-[#d71b15]/18 bg-[#fff6f1] px-3 py-2 text-[11px] font-extrabold tracking-[0.08em] text-[#c91510] lg:inline-flex"
          >
            <Phone size={13} />
            Call
          </a>

          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-red/10 bg-surface-elevated text-text-main transition hover:bg-[#fff2ee] dark:hover:bg-zinc-800 sm:h-10 sm:w-10"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <Link
            href="/cart"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-red/10 bg-surface-elevated text-text-main transition hover:bg-[#fff2ee] dark:hover:bg-zinc-800 sm:h-10 sm:w-10"
            aria-label="Open cart"
          >
            <ShoppingCart size={16} />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c91510] text-[9px] font-bold text-white">
                {totalItems}
              </span>
            ) : null}
          </Link>

          {isLoggedIn && userId ? (
            <NotificationCenter
              mode={isAdmin ? "admin" : "customer"}
              userId={userId}
              initialNotifications={initialNotifications}
              notificationsAvailable={notificationsAvailable}
            />
          ) : null}

          <button
            onClick={() => setOpen((value) => !value)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-brand-red/10 bg-surface-elevated text-text-main md:hidden sm:h-10 sm:w-10"
            aria-label="Open menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>

          {isLoggedIn ? (
            <form
              action="/auth/logout"
              method="post"
              className="hidden md:block"
            >
              <Button variant="outline" type="submit">
                Logout
              </Button>
            </form>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button>
                <Sparkles size={14} />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>

      {open ? (
        <div className="border-t border-[#d71b15]/10 bg-surface-elevated/95 px-4 py-4 backdrop-blur md:hidden">
          <div className="grid gap-2">
            {links.map((link) => {
              const active = linkIsActive(pathname, link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    active
                      ? "bg-[#c91510] text-white"
                      : "text-text-main hover:bg-[#fff1ed] dark:hover:bg-zinc-800",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            {isLoggedIn ? (
              <form
                action="/auth/logout"
                method="post"
                onSubmit={() => setOpen(false)}
              >
                <Button variant="outline" type="submit" className="w-full">
                  Logout
                </Button>
              </form>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button className="w-full">Login</Button>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
