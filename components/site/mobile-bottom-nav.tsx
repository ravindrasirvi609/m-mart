"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ReceiptText, ShoppingCart, User } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Shop", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-2 pt-1 md:hidden">
      <div className="pointer-events-auto mx-auto flex max-w-xl items-center justify-around rounded-2xl border border-[#d71b15]/18 bg-white/95 px-2 py-2 shadow-[0_-10px_30px_rgba(16,20,30,0.14)] backdrop-blur dark:border-zinc-700 dark:bg-[#0f141d]/95">
        {nav.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-14 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-extrabold tracking-[0.04em] transition",
                active
                  ? "bg-[#fff0ec] text-[#c91510] dark:bg-zinc-800 dark:text-[#ff7152]"
                  : "text-zinc-500 dark:text-zinc-300",
              )}
            >
              <Icon size={17} />
              <span>{item.label}</span>

              {item.href === "/cart" && totalItems > 0 ? (
                <span className="absolute right-0 top-0 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#c91510] px-1 text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
