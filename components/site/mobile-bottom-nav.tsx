"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ReceiptText, ShoppingCart, User } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/products", label: "Categories", icon: LayoutGrid },
  { href: "/cart", label: "Cart", icon: ShoppingCart },
  { href: "/orders", label: "Orders", icon: ReceiptText },
  { href: "/profile", label: "Profile", icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { totalItems } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-red-100 bg-white/95 px-4 py-2 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-xl items-center justify-around">
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
                "relative flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold",
                active ? "text-[#e10600]" : "text-zinc-500 dark:text-zinc-300",
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.href === "/cart" && totalItems > 0 ? (
                <span className="absolute right-1 top-0 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-[#e10600] px-1 text-[9px] text-white">
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
