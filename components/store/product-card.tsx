import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { Product } from "@/lib/queries";
import { formatCurrency, getEffectivePrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const effectivePrice = getEffectivePrice(
    product.price,
    product.discount_price,
  );
  const discountPercent =
    product.discount_price !== null && product.price > product.discount_price
      ? Math.round(
          ((product.price - product.discount_price) / product.price) * 100,
        )
      : 0;

  return (
    <article className="product-card-compact group flex h-full flex-col">
      <Link
        href={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-surface-elevated"
      >
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Subtle gradient for readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />

        {/* Discount badge */}
        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 rounded-lg bg-gradient-to-r from-[#ff6a3f] to-[#e0341f] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
            {discountPercent}% OFF
          </span>
        )}

        {/* Stock indicator on image */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-rose-600 dark:bg-zinc-900/95 dark:text-rose-400">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2 p-3">
        <div className="space-y-1">
          {/* Category + Qty */}
          <div className="flex items-center gap-1.5">
            <p className="line-clamp-1 text-[10px] font-bold uppercase tracking-wider text-text-subtle">
              {product.category}
            </p>
            {product.net_qty && (
              <span className="rounded bg-badge-bg px-1.5 py-0.5 text-[9px] font-bold text-badge-text">
                {product.net_qty}
              </span>
            )}
          </div>

          {/* Name */}
          <Link href={`/products/${product.id}`} className="block">
            <p className="line-clamp-2 text-sm font-bold leading-tight text-text-main">
              {product.name}
            </p>
          </Link>
        </div>

        {/* Price + Cart */}
        <div className="mt-auto space-y-2">
          <div className="flex items-baseline gap-1.5">
            <p className="text-base font-extrabold text-brand-red">
              {formatCurrency(effectivePrice)}
            </p>
            {product.discount_price !== null && (
              <p className="text-[11px] font-medium text-text-subtle line-through">
                {formatCurrency(product.price)}
              </p>
            )}
          </div>

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
      </div>
    </article>
  );
}
