import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { getProductById } from "@/lib/queries";
import { formatCurrency, getEffectivePrice } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const effectivePrice = getEffectivePrice(product.price, product.discount_price);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      <article className="space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-emerald-700">{product.category}</p>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{product.name}</h1>
        <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">{product.description}</p>

        <div className="flex items-center gap-3">
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(effectivePrice)}</p>
          {product.discount_price !== null ? (
            <p className="text-sm text-zinc-400 line-through">{formatCurrency(product.price)}</p>
          ) : null}
        </div>

        <p
          className={`text-sm font-semibold ${
            product.stock > 0 ? "text-emerald-700" : "text-rose-700"
          }`}
        >
          {product.stock > 0 ? `${product.stock} items in stock` : "Out of stock"}
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
      </article>
    </div>
  );
}
