"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { showAppToast, triggerHaptic } from "@/lib/mobile/feedback";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  product: {
    id: string;
    name: string;
    image_url: string;
    price: number;
    discount_price: number | null;
    stock: number;
  };
  disabled?: boolean;
};

export function AddToCartButton({ product, disabled }: AddToCartButtonProps) {
  const { addItem, items, setQuantity, removeItem } = useCart();
  const [bump, setBump] = useState(false);

  const cartItem = items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity ?? 0;

  if (quantity > 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-between rounded-xl bg-gradient-to-r from-[#ff6a3f] to-[#c91510] px-1 py-1 shadow-sm",
          bump && "animate-cart-bump",
        )}
      >
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white transition active:scale-90"
          onClick={() => {
            if (quantity <= 1) {
              removeItem(product.id);
            } else {
              setQuantity(product.id, quantity - 1);
            }
            setBump(true);
            window.setTimeout(() => setBump(false), 300);
            triggerHaptic("light").catch(() => undefined);
          }}
        >
          <Minus size={14} strokeWidth={2.5} />
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-extrabold text-white">
          {quantity}
        </span>
        <button
          type="button"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20 text-white transition active:scale-90"
          disabled={quantity >= product.stock}
          onClick={() => {
            setQuantity(product.id, quantity + 1);
            setBump(true);
            window.setTimeout(() => setBump(false), 300);
            triggerHaptic("light").catch(() => undefined);
          }}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "quick-add-btn flex w-full items-center justify-center gap-1.5",
        bump && "animate-cart-bump",
      )}
      disabled={disabled}
      onClick={() => {
        addItem(product);
        setBump(true);
        window.setTimeout(() => setBump(false), 450);
        showAppToast(`${product.name} added to cart`, "success").catch(() => undefined);
        triggerHaptic("light").catch(() => undefined);
      }}
    >
      <Plus size={14} strokeWidth={2.5} />
      ADD
    </button>
  );
}
