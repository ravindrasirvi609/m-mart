"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
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
      <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-flex">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {items.map((item) => {
          const unitPrice = getEffectivePrice(item.price, item.discount_price);

          return (
            <div
              key={item.id}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Image
                  src={item.image_url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </p>
                  <p className="text-xs text-zinc-500">{formatCurrency(unitPrice)} each</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <Button
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>

                  <Button variant="ghost" onClick={() => removeItem(item.id)}>
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Order Summary</h2>

        <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>{deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
          Free delivery on orders above ₹500. Below ₹500, delivery charge is ₹30.
        </p>

        <Link href="/checkout" className="block">
          <Button className="w-full">Proceed to Checkout</Button>
        </Link>

        <Button variant="ghost" className="w-full" onClick={clearCart}>
          Clear Cart
        </Button>
      </aside>
    </div>
  );
}
