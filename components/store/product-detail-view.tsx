"use client";

import Image from "next/image";
import { ShieldCheck, Star, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { formatCurrency, getEffectivePrice } from "@/lib/utils";

type ProductDetailViewProps = {
  product: {
    id: string;
    name: string;
    category: string;
    description: string;
    image_url: string;
    price: number;
    discount_price: number | null;
    stock: number;
  };
};

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"description" | "reviews">("description");
  const effectivePrice = getEffectivePrice(product.price, product.discount_price);

  const addWithQuantity = () => {
    for (let index = 0; index < quantity; index += 1) {
      addItem({
        id: product.id,
        name: product.name,
        image_url: product.image_url,
        price: product.price,
        discount_price: product.discount_price,
        stock: product.stock,
      });
    }

    toast.success(`${quantity} × ${product.name} added to cart`);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.96fr]">
      <div className="premium-card group relative min-h-[380px] overflow-hidden rounded-[1.8rem]">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 48vw"
        />
      </div>

      <article className="premium-card space-y-5 p-6">
        <p className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#e10600]">
          {product.category}
        </p>

        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            {product.name}
          </h1>
          <p className="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
            {product.description}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <p className="price-text">{formatCurrency(effectivePrice)}</p>
          {product.discount_price !== null ? (
            <p className="pb-1 text-sm text-zinc-400 line-through">{formatCurrency(product.price)}</p>
          ) : null}
        </div>

        <p className={`text-xs font-bold uppercase tracking-[0.08em] ${product.stock > 0 ? "text-emerald-700" : "text-rose-700"}`}>
          {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
        </p>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-red-100 bg-white">
            <button
              type="button"
              className="h-10 w-10 text-lg"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              className="h-10 w-10 text-lg"
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
            >
              +
            </button>
          </div>

          <Button disabled={product.stock <= 0} onClick={addWithQuantity}>
            Add to Cart
          </Button>
        </div>

        <div className="grid gap-2 rounded-2xl bg-red-50/70 p-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <p className="flex items-center gap-2"><Truck size={14} /> Delivery in 30-45 mins</p>
          <p className="flex items-center gap-2"><ShieldCheck size={14} /> Secure manual UPI verification</p>
          <p className="flex items-center gap-2"><Star size={14} /> Quality checked before dispatch</p>
        </div>

        <div className="space-y-3 border-t border-red-100 pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("description")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] ${
                tab === "description" ? "bg-[#e10600] text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setTab("reviews")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] ${
                tab === "reviews" ? "bg-[#e10600] text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              Reviews
            </button>
          </div>

          {tab === "description" ? (
            <p className="animate-page-enter text-sm leading-7 text-zinc-600 dark:text-zinc-300">
              {product.description}. Carefully packed and dispatched with local delivery partner support.
            </p>
          ) : (
            <div className="animate-page-enter space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
              <p>★★★★★ “Fresh quality and timely delivery.”</p>
              <p>★★★★★ “Very smooth checkout and updates.”</p>
            </div>
          )}
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-red-100 bg-white/95 p-3 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">Total</p>
            <p className="font-bold text-[#e10600]">{formatCurrency(effectivePrice * quantity)}</p>
          </div>
          <Button className="min-w-40" disabled={product.stock <= 0} onClick={addWithQuantity}>
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
