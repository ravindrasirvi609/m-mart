"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Moon, Phone, ShoppingCart, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
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
};

const baseLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/orders", label: "Orders" },
  { href: "/profile", label: "Profile" },
];

export function MainHeader({
  isAdmin,
  isLoggedIn,
  userId,
  initialNotifications,
  notificationsAvailable,
}: MainHeaderProps) {
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const links = isAdmin
    ? [...baseLinks, { href: "/admin", label: "Admin" }]
    : baseLinks;

  return (
    <header className="sticky top-0 z-50 border-b border-red-100/70 bg-white/95 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff3b30] to-[#e10600] text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(225,6,0,0.32)]">
            MM
          </div>
          <div>
            <p className="font-heading text-base font-bold tracking-wide text-zinc-900 dark:text-zinc-100">
              {STORE.name}
            </p>
            <p className="text-xs text-zinc-500">Hinjewadi Phase 1</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] transition",
                pathname === link.href
                  ? "bg-[#e10600] text-white"
                  : "text-zinc-600 hover:bg-red-50 hover:text-[#e10600] dark:text-zinc-200 dark:hover:bg-zinc-800",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${STORE.phone}`}
            className="hidden items-center gap-1 rounded-full border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#e10600] lg:inline-flex"
          >
            <Phone size={13} />
            Call
          </a>

          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-zinc-600 transition hover:bg-red-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? <Sun size={17} /> : mounted ? <Moon size={17} /> : <div className="h-[17px] w-[17px]" />}
          </button>

          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-zinc-700 transition hover:bg-red-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <ShoppingCart size={17} />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e10600] px-1 text-[10px] font-bold text-white">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-zinc-700 md:hidden dark:border-zinc-700 dark:text-zinc-100"
            aria-label="Open menu"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>

          {isLoggedIn ? (
            <form action="/auth/logout" method="post" className="hidden md:block">
              <Button variant="outline" type="submit">
                Logout
              </Button>
            </form>
          ) : (
            <Link href="/login" className="hidden md:block">
              <Button>Login</Button>
            </Link>
          )}
        </div>
      </div>

      {open ? (
        <div className="border-t border-red-100 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <div className="grid gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-red-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {link.label}
              </Link>
            ))}
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
