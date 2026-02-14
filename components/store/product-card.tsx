import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import type { Product } from "@/lib/queries";
import { formatCurrency, getEffectivePrice } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const effectivePrice = getEffectivePrice(product.price, product.discount_price);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <Link href={`/products/${product.id}`} className="relative block h-44 w-full bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      </Link>

      <div className="space-y-3 p-4">
        <div>
          <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {product.name}
          </p>
          <p className="text-xs text-zinc-500">{product.category}</p>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-emerald-700">
            {formatCurrency(effectivePrice)}
          </p>
          {product.discount_price !== null ? (
            <p className="text-xs text-zinc-400 line-through">
              {formatCurrency(product.price)}
            </p>
          ) : null}
        </div>

        <p
          className={`text-xs font-semibold ${
            product.stock > 0 ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
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
