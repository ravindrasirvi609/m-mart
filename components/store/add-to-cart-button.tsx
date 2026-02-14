"use client";

import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";

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

  return (
    <Button
      className="w-full"
      disabled={disabled}
      onClick={() => {
        addItem(product);
        toast.success(`${product.name} added to cart`);
      }}
    >
      Add to Cart
    </Button>
  );
}
