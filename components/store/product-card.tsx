import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { Product } from "@/lib/queries";
import { formatCurrency, getEffectivePrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const effectivePrice = getEffectivePrice(product.price, product.discount_price);
  const discountPercent =
    product.discount_price !== null && product.price > product.discount_price
      ? Math.round(((product.price - product.discount_price) / product.price) * 100)
      : 0;

  return (
    <article className="group glow-on-hover premium-card overflow-hidden rounded-3xl">
      <Link href={`/products/${product.id}`} className="relative block h-48 overflow-hidden bg-zinc-100">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, 25vw"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/22 via-transparent to-transparent" />

        <button
          type="button"
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-zinc-600 shadow-sm transition hover:text-[#c91510]"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>

        {discountPercent > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
            {discountPercent}% Off
          </span>
        ) : null}
      </Link>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="line-clamp-1 font-heading text-base font-bold text-zinc-900 dark:text-zinc-100">
            {product.name}
          </p>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.09em] text-zinc-500 dark:text-zinc-300">
            {product.category}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <p className="price-text">{formatCurrency(effectivePrice)}</p>
          {product.discount_price !== null ? (
            <p className="pb-0.5 text-xs font-medium text-zinc-500 line-through dark:text-zinc-400">
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
          {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
        </p>

        <AddToCartButton
          product={{
            id: product.id,
            name: product.name,
            image_url: product.image_url,
            price: product.price,
            discount_price: product.discount_price,
            stock: product.stock,
          }}
          disabled={product.stock <= 0}
        />
      </div>
    </article>
  );
}
