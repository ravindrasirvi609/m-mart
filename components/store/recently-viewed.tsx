"use client";

import { useCallback, useEffect, useState } from "react";

import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/queries";

const STORAGE_KEY = "mmart_recently_viewed";
const MAX_ITEMS = 6;

/**
 * Records a product view in localStorage.
 * Call this from the product detail page.
 */
export function recordProductView(productId: string) {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]",
    ) as string[];
    const filtered = stored.filter((id) => id !== productId);
    filtered.unshift(productId);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(filtered.slice(0, MAX_ITEMS * 2)),
    );
  } catch {
    // localStorage unavailable
  }
}

/**
 * Returns recently viewed product IDs from localStorage.
 */
export function getRecentlyViewedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

/**
 * Client component that displays recently viewed products.
 * Fetches product data from an API route based on stored IDs.
 */
export function RecentlyViewed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    const ids = getRecentlyViewedIds().slice(0, MAX_ITEMS);

    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/products?ids=${ids.join(",")}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = (await response.json()) as { products: Product[] };
        // Preserve the order of IDs
        const ordered = ids
          .map((id) => data.products.find((p) => p.id === id))
          .filter(Boolean) as Product[];
        setProducts(ordered);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (loading || products.length === 0) return null;

  return (
    <section className="space-y-4">
      <Reveal>
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">
            👀
          </span>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Recently Viewed
          </h2>
        </div>
      </Reveal>

      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="w-[180px] flex-shrink-0 snap-start sm:w-[210px] lg:w-[240px]"
          >
            <Reveal delay={index * 50}>
              <ProductCard product={product} />
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
}
