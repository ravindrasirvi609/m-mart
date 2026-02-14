"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, ShoppingCart, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/constants";
import { useCart } from "@/components/providers/cart-provider";

type MainHeaderProps = {
  isAdmin: boolean;
  isLoggedIn: boolean;
};

export function MainHeader({ isAdmin, isLoggedIn }: MainHeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const { totalItems } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="rounded-lg bg-emerald-600 px-2 py-1 text-sm font-bold text-white">
            MM
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{STORE.name}</p>
            <p className="text-xs text-zinc-500">Hinjewadi Phase 1</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-medium text-zinc-600 md:flex dark:text-zinc-300">
          <Link href="/products">Products</Link>
          <Link href="/orders">Orders</Link>
          <Link href="/profile">Profile</Link>
          {isAdmin ? <Link href="/admin">Admin</Link> : null}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="h-9 w-9 p-0"
          >
            {resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          <Link href="/cart" className="relative rounded-xl p-2 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
            <ShoppingCart size={18} />
            {totalItems > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold text-white">
                {totalItems}
              </span>
            ) : null}
          </Link>

          {isLoggedIn ? (
            <Link href="/auth/logout">
              <Button variant="secondary" className="hidden sm:inline-flex">
                Logout
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="hidden sm:inline-flex">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
