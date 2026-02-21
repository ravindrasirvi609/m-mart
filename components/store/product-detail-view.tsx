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
      <div className="premium-card group relative min-h-[420px] overflow-hidden rounded-[1.8rem]">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 48vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>

      <article className="premium-card space-y-5 p-6 lg:sticky lg:top-24 lg:h-fit">
        <p className="inline-flex rounded-full bg-[#fff0ea] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#c91510] dark:bg-[#2a1a1d] dark:text-[#ff8a6e]">
          {product.category}
        </p>

        <div>
          <h1 className="font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-sm leading-7 text-zinc-700 dark:text-zinc-200">
            {product.description}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <p className="price-text">{formatCurrency(effectivePrice)}</p>
          {product.discount_price !== null ? (
            <p className="pb-1 text-sm font-medium text-zinc-500 line-through dark:text-zinc-400">
              {formatCurrency(product.price)}
            </p>
          ) : null}
        </div>

        <p
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.06em] ${
            product.stock > 0
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
          }`}
        >
          {product.stock > 0 ? `${product.stock} units available` : "Out of stock"}
        </p>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-[#c91510]/20 bg-white dark:bg-zinc-900">
            <button
              type="button"
              className="h-10 w-10 text-lg font-semibold"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-bold">{quantity}</span>
            <button
              type="button"
              className="h-10 w-10 text-lg font-semibold"
              onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
            >
              +
            </button>
          </div>

          <Button disabled={product.stock <= 0} onClick={addWithQuantity}>
            Add to Cart
          </Button>
        </div>

        <div className="grid gap-2 rounded-2xl bg-[#fff4ef] p-4 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          <p className="flex items-center gap-2"><Truck size={14} /> Delivery in 30-45 mins</p>
          <p className="flex items-center gap-2"><ShieldCheck size={14} /> Secure manual UPI verification</p>
          <p className="flex items-center gap-2"><Star size={14} /> Quality checked before dispatch</p>
        </div>

        <div className="space-y-3 border-t border-[#c91510]/14 pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTab("description")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.08em] ${
                tab === "description"
                  ? "bg-[#c91510] text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              Description
            </button>
            <button
              type="button"
              onClick={() => setTab("reviews")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.08em] ${
                tab === "reviews"
                  ? "bg-[#c91510] text-white"
                  : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              }`}
            >
              Reviews
            </button>
          </div>

          {tab === "description" ? (
            <p className="animate-page-enter text-sm leading-7 text-zinc-700 dark:text-zinc-200">
              {product.description}. Carefully packed and dispatched with local delivery partner support.
            </p>
          ) : (
            <div className="animate-page-enter space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
              <p>★★★★★ “Fresh quality and timely delivery.”</p>
              <p>★★★★★ “Very smooth checkout and updates.”</p>
            </div>
          )}
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-20 z-30 border-t border-[#c91510]/16 bg-white/96 p-3 backdrop-blur md:hidden dark:border-zinc-700 dark:bg-[#0f141d]/95">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-300">Total</p>
            <p className="font-bold text-[#c91510]">{formatCurrency(effectivePrice * quantity)}</p>
          </div>
          <Button className="min-w-40" disabled={product.stock <= 0} onClick={addWithQuantity}>
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
