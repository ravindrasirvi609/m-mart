"use client";

import Image from "next/image";
import {
  ShieldCheck,
  Star,
  Truck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
    image_urls?: string[];
    net_qty?: string | null;
    product_highlights?: Record<string, string> | null;
    price: number;
    discount_price: number | null;
    stock: number;
  };
};

function ImageGallery({ images, name }: { images: string[]; name: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length <= 1) {
    return (
      <div className="premium-card group relative min-h-[420px] overflow-hidden rounded-[1.8rem]">
        <Image
          src={images[0] || "/placeholder-product.svg"}
          alt={name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 48vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="premium-card group relative min-h-[420px] overflow-hidden rounded-[1.8rem]">
        <Image
          src={images[activeIndex]}
          alt={`${name} - image ${activeIndex + 1}`}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 48vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) =>
              prev === 0 ? images.length - 1 : prev - 1,
            )
          }
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-zinc-700 shadow transition hover:bg-white dark:bg-zinc-800/80 dark:text-zinc-200"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          onClick={() =>
            setActiveIndex((prev) =>
              prev === images.length - 1 ? 0 : prev + 1,
            )
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-zinc-700 shadow transition hover:bg-white dark:bg-zinc-800/80 dark:text-zinc-200"
        >
          <ChevronRight size={18} />
        </button>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white">
          {activeIndex + 1} / {images.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIndex(i)}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
              i === activeIndex
                ? "border-[#c91510] ring-2 ring-[#c91510]/30"
                : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image
              src={url}
              alt={`${name} thumb ${i + 1}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductHighlights({
  highlights,
}: {
  highlights: Record<string, string>;
}) {
  const entries = Object.entries(highlights);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl bg-[#fff4ef] p-4 dark:bg-[#1e1518]">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-subtle">
        Product Highlights
      </h3>
      <dl className="grid gap-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <dt className="text-[11px] font-bold uppercase tracking-wider text-text-subtle">
              {key}
            </dt>
            <dd className="text-sm text-text-main">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function ProductDetailView({ product }: ProductDetailViewProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState<"description" | "highlights" | "reviews">(
    "description",
  );
  const effectivePrice = getEffectivePrice(
    product.price,
    product.discount_price,
  );

  const allImages: string[] = [];
  if (product.image_urls && product.image_urls.length > 0) {
    allImages.push(...product.image_urls);
  } else if (product.image_url) {
    allImages.push(product.image_url);
  }
  if (allImages.length === 0 && product.image_url) {
    allImages.push(product.image_url);
  }

  const hasHighlights =
    product.product_highlights &&
    Object.keys(product.product_highlights).length > 0;

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
    <div className="grid gap-5 lg:grid-cols-[1fr_0.96fr] lg:gap-6">
      <ImageGallery images={allImages} name={product.name} />

      <article className="premium-card space-y-4 p-4 sm:space-y-5 sm:p-6 lg:sticky lg:top-24 lg:h-fit">
        <div className="flex flex-wrap items-center gap-2">
          <p className="inline-flex rounded-full bg-[#fff0ea] px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-[#c91510] dark:bg-[#2a1a1d] dark:text-[#ff8a6e]">
            {product.category}
          </p>
          {product.net_qty && (
            <p className="inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              {product.net_qty}
            </p>
          )}
        </div>

        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-text-main sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-subtle sm:mt-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <p className="price-text">{formatCurrency(effectivePrice)}</p>
          {product.discount_price !== null ? (
            <p className="pb-1 text-sm font-medium text-text-subtle line-through">
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
          {product.stock > 0
            ? `${product.stock} units available`
            : "Out of stock"}
        </p>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center rounded-xl border border-[#c91510]/20 bg-surface-elevated">
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-text-main transition active:scale-90 sm:h-10 sm:w-10"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              −
            </button>
            <span className="w-7 text-center text-sm font-bold text-text-main sm:w-8">
              {quantity}
            </span>
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center text-lg font-semibold text-text-main transition active:scale-90 sm:h-10 sm:w-10"
              onClick={() =>
                setQuantity((value) => Math.min(product.stock, value + 1))
              }
            >
              +
            </button>
          </div>

          <Button disabled={product.stock <= 0} onClick={addWithQuantity}>
            Add to Cart
          </Button>
        </div>

        <div className="grid gap-2 rounded-2xl bg-[#fff4ef] p-4 text-sm text-text-subtle dark:bg-[#1e1518]">
          <p className="flex items-center gap-2">
            <Truck size={14} /> Delivery in 30-45 mins
          </p>
          <p className="flex items-center gap-2">
            <ShieldCheck size={14} /> Secure manual UPI verification
          </p>
          <p className="flex items-center gap-2">
            <Star size={14} /> Quality checked before dispatch
          </p>
        </div>

        <div className="space-y-3 border-t border-[#c91510]/14 pt-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("description")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.08em] ${
                tab === "description"
                  ? "bg-[#c91510] text-white"
                  : "bg-zinc-100 text-text-subtle dark:bg-zinc-800 dark:text-text-subtle"
              }`}
            >
              Description
            </button>
            {hasHighlights && (
              <button
                type="button"
                onClick={() => setTab("highlights")}
                className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.08em] ${
                  tab === "highlights"
                    ? "bg-[#c91510] text-white"
                    : "bg-zinc-100 text-text-subtle dark:bg-zinc-800 dark:text-text-subtle"
                }`}
              >
                Highlights
              </button>
            )}
            <button
              type="button"
              onClick={() => setTab("reviews")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold tracking-[0.08em] ${
                tab === "reviews"
                  ? "bg-[#c91510] text-white"
                  : "bg-zinc-100 text-text-subtle dark:bg-zinc-800 dark:text-text-subtle"
              }`}
            >
              Reviews
            </button>
          </div>

          {tab === "description" && (
            <p className="animate-page-enter text-sm leading-7 text-text-subtle">
              {product.description}. Carefully packed and dispatched with local
              delivery partner support.
            </p>
          )}

          {tab === "highlights" && hasHighlights && (
            <div className="animate-page-enter">
              <ProductHighlights highlights={product.product_highlights!} />
            </div>
          )}

          {tab === "reviews" && (
            <div className="animate-page-enter space-y-2 text-sm text-text-subtle">
              <p>
                &#9733;&#9733;&#9733;&#9733;&#9733; &quot;Fresh quality and
                timely delivery.&quot;
              </p>
              <p>
                &#9733;&#9733;&#9733;&#9733;&#9733; &quot;Very smooth checkout
                and updates.&quot;
              </p>
            </div>
          )}
        </div>
      </article>

      <div className="floating-cart-bar fixed inset-x-0 bottom-[4.5rem] z-30 p-3 md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-subtle">
              Total
            </p>
            <p className="text-lg font-extrabold text-[#c91510]">
              {formatCurrency(effectivePrice * quantity)}
            </p>
          </div>
          <Button
            className="min-w-36 sm:min-w-40"
            disabled={product.stock <= 0}
            onClick={addWithQuantity}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
