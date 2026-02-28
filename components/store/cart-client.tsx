"use client";

import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, MapPin, TicketPercent, Trash2 } from "lucide-react";

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
    baseDeliveryFee,
    freeDeliveryThreshold,
    deliveryZone,
    outOfCoverage,
    removeItem,
    setQuantity,
    clearCart,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="premium-card border-dashed p-10 text-center">
        <p className="text-sm font-medium text-text-subtle">
          Your cart is empty.
        </p>
        <Link href="/products" className="mt-4 inline-flex">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_350px] lg:gap-6">
      <div className="space-y-3">
        {items.map((item, index) => {
          const unitPrice = getEffectivePrice(item.price, item.discount_price);

          return (
            <div
              key={item.id}
              className="animate-slide-in premium-card p-3 sm:p-4"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex gap-3">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-elevated sm:h-24 sm:w-24">
                  <Image
                    src={item.image_url}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between gap-1.5">
                  <div>
                    <p className="font-heading text-sm font-bold text-text-main sm:text-base">
                      {item.name}
                    </p>
                    <p className="text-xs font-semibold text-text-subtle">
                      {formatCurrency(unitPrice)} each
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-xl border border-[#c91510]/20 bg-surface-elevated">
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center text-base font-semibold text-text-main transition active:scale-90 sm:h-9 sm:w-9"
                        onClick={() => setQuantity(item.id, item.quantity - 1)}
                      >
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-text-main sm:w-8">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center text-base font-semibold text-text-main transition active:scale-90 sm:h-9 sm:w-9"
                        onClick={() => setQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <p className="text-sm font-extrabold text-brand-red">
                        {formatCurrency(unitPrice * item.quantity)}
                      </p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-bold text-text-subtle transition hover:text-rose-600"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <aside className="premium-card sticky top-24 h-fit space-y-4 p-4 sm:p-5">
        <h2 className="font-heading text-lg font-extrabold text-text-main">
          Pricing Summary
        </h2>

        <div className="space-y-2 text-sm font-medium text-text-subtle">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Delivery</span>
            <span>
              {deliveryCharge === 0 ? "Free" : formatCurrency(deliveryCharge)}
            </span>
          </div>
          <div className="flex justify-between border-t border-[#c91510]/16 pt-3 text-base font-black text-[#c91510]">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-[#c91510]/20 p-3">
          <label className="mb-2 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-text-subtle sm:text-xs">
            <TicketPercent size={13} />
            Coupon (Coming Soon)
          </label>
          <Input placeholder="Enter coupon code" disabled />
        </div>

        <p className="rounded-xl bg-[#fff2ec] p-3 text-xs font-bold text-[#c91510] dark:bg-[#1e1518] dark:text-[#ff8a6e]">
          {deliveryZone ? (
            <>
              <MapPin size={12} className="mr-1 inline-block" />
              {deliveryZone.areaName} &middot; Free delivery above ₹
              {freeDeliveryThreshold}.
              {subtotal < freeDeliveryThreshold &&
                ` Below ₹${freeDeliveryThreshold}, delivery ₹${baseDeliveryFee}.`}
            </>
          ) : (
            <>
              Free delivery above ₹{freeDeliveryThreshold}. Below ₹
              {freeDeliveryThreshold}, delivery charge ₹{baseDeliveryFee}.
            </>
          )}
        </p>

        {outOfCoverage && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/30 dark:bg-amber-950/20">
            <AlertTriangle
              size={14}
              className="mt-0.5 shrink-0 text-amber-600"
            />
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
              Your location may be outside our delivery area. You can still
              place an order, but delivery may take longer.
            </p>
          </div>
        )}

        <Link href="/checkout" className="block">
          <Button className="w-full">Proceed to Checkout</Button>
        </Link>

        <Button variant="ghost" className="w-full" onClick={clearCart}>
          Clear Cart
        </Button>
      </aside>

      <div className="floating-cart-bar fixed inset-x-0 bottom-[4.5rem] z-30 p-3 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle">
              Total
            </p>
            <p className="text-lg font-extrabold text-[#c91510]">
              {formatCurrency(total)}
            </p>
          </div>
          <Link href="/checkout">
            <Button>Checkout →</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
