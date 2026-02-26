"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/queries";

type InfiniteProductsListProps = {
  initialProducts: Product[];
  search: string;
  category: string;
  totalCount: number;
};

export function InfiniteProductsList({
  initialProducts,
  search,
  category,
  totalCount,
}: InfiniteProductsListProps) {
  const [products, setProducts] = useState(initialProducts);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProducts(initialProducts);
    setPage(1);
    setHasError(false);
  }, [initialProducts, search, category, totalCount]);

  const hasMore = useMemo(() => products.length < totalCount, [products.length, totalCount]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    setHasError(false);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page + 1));

      if (search) {
        params.set("search", search);
      }

      if (category && category !== "all") {
        params.set("category", category);
      }

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to load products");
      }

      const payload = (await response.json()) as {
        products: Product[];
      };

      setProducts((currentProducts) => [...currentProducts, ...payload.products]);
      setPage((currentPage) => currentPage + 1);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [category, hasMore, isLoading, page, search]);

  useEffect(() => {
    const node = sentinelRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;

        if (entry?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "180px" },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <Reveal key={`${product.id}-${index}`} delay={(index % 8) * 45}>
            <ProductCard product={product} />
          </Reveal>
        ))}
      </div>

      <div ref={sentinelRef} className="h-6" aria-hidden />

      {isLoading ? (
        <div className="premium-card animate-pulse p-4 text-center text-xs font-extrabold uppercase tracking-[0.09em] text-text-subtle">
          Loading more products...
        </div>
      ) : null}

      {!hasMore && products.length > 0 ? (
        <div className="premium-card p-4 text-center text-xs font-extrabold uppercase tracking-[0.09em] text-text-subtle">
          You have reached the end of the list.
        </div>
      ) : null}

      {hasError ? (
        <div className="premium-card flex flex-col items-center gap-3 p-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-rose-600">
            Could not load more products.
          </p>
          <button
            type="button"
            className="rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:bg-surface-muted"
            onClick={() => void loadMore()}
          >
            Try again
          </button>
        </div>
      ) : null}
    </div>
  );
}
