"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
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
  const { addItem } = useCart();
  const [bump, setBump] = useState(false);

  return (
    <Button
      className={cn("w-full", bump && "animate-cart-bump")}
      disabled={disabled}
      onClick={() => {
        addItem(product);
        setBump(true);
        window.setTimeout(() => setBump(false), 450);
        showAppToast(`${product.name} added to cart`, "success").catch(() => undefined);
        triggerHaptic("light").catch(() => undefined);
      }}
    >
      <ShoppingCart size={14} />
      Add to Cart
    </Button>
  );
}
