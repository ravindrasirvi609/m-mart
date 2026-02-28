"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  ReceiptText,
  ShoppingCart,
  User,
} from "lucide-react";

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
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 md:hidden">
      <div className="bottom-nav-container pointer-events-auto mx-auto flex max-w-lg items-center justify-around rounded-2xl px-1 py-1.5">
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
                "relative flex min-w-[3.2rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-[10px] font-bold tracking-wide transition-all duration-200",
                active
                  ? "text-[#c91510] dark:text-[#ff7152]"
                  : "text-text-subtle",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200",
                  active
                    ? "bg-[#fff0ec] shadow-sm dark:bg-[#2a1a1d]"
                    : "bg-transparent",
                )}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={cn(active ? "font-extrabold" : "font-semibold")}>
                {item.label}
              </span>

              {item.href === "/cart" && totalItems > 0 && (
                <span className="absolute right-0.5 top-0 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#c91510] text-[9px] font-bold text-white shadow-sm">
                  {totalItems}
                </span>
              )}

              {active && (
                <span className="absolute -bottom-0.5 h-0.5 w-4 rounded-full bg-[#c91510] dark:bg-[#ff7152]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
