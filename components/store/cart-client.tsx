"use client";

import Image from "next/image";
import Link from "next/link";
import { TicketPercent, Trash2 } from "lucide-react";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, getEffectivePrice } from "@/lib/utils";

export function CartClient() {
  const {
    items,
    subtotal,
    deliveryCharge,
    total,
    removeItem,
    setQuantity,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="premium-card border-dashed p-10 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-flex">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
      <div className="space-y-4">
        {items.map((item, index) => {
          const unitPrice = getEffectivePrice(item.price, item.discount_price);

          return (
            <div
              key={item.id}
              className="animate-slide-in rounded-3xl border border-red-100 bg-white p-4 shadow-sm"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="flex gap-3">
                <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-zinc-100">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between gap-2">
                  <div>
                    <p className="font-heading text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {item.name}
                    </p>
                    <p className="text-xs uppercase tracking-[0.08em] text-zinc-500">
                      {formatCurrency(unitPrice)} each
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-xl border border-red-100 bg-white">
                      <button
                        type="button"
                        className="h-9 w-9 text-lg"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        className="h-9 w-9 text-lg"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.1em] text-zinc-500 hover:text-rose-600"
                      onClick={() => removeItem(item.id)}
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="premium-card sticky top-24 h-fit space-y-4 p-5">
        <h2 className="font-heading text-lg font-bold">Pricing Summary</h2>

        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}</span>
          </div>
          <div className="flex justify-between border-t border-red-100 pt-3 text-base font-black text-[#e10600]">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-red-200 p-3">
          <label className="mb-2 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-zinc-600">
            <TicketPercent size={14} />
            Coupon (Coming Soon)
          </label>
          <Input placeholder="Enter coupon code" disabled />
        </div>

        <p className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-[#e10600]">
          Free delivery above ₹500. Below ₹500, delivery charge ₹30.
        </p>

        <Link href="/checkout" className="block">
          <Button className="w-full">Proceed to Checkout</Button>
        </Link>

        <Button variant="ghost" className="w-full" onClick={clearCart}>
          Clear Cart
        </Button>
      </aside>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-red-100 bg-white/95 p-3 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">Total</p>
            <p className="font-bold text-[#e10600]">{formatCurrency(total)}</p>
          </div>
          <Link href="/checkout">
            <Button>Checkout</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
