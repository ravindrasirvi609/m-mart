"use client";

import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
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
        toast.success(`${product.name} added to cart`);
      }}
    >
      <ShoppingCart size={14} />
      Add to Cart
    </Button>
  );
}
