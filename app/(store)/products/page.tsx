import type { Metadata } from "next";

import { PaginationControls } from "@/components/store/pagination-controls";
import { ProductCard } from "@/components/store/product-card";
import { ProductFilters } from "@/components/store/product-filters";
import { Reveal } from "@/components/ui/reveal";
import { PAGE_SIZE } from "@/lib/constants";
import { getProductsPageData } from "@/lib/queries";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const query = String(params.search || "");

  return {
    title: query ? `Search: ${query}` : "All Products",
    description: query
      ? `Browse grocery products matching ${query}.`
      : "Browse all grocery products from Mmart.",
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = String(params.search ?? "").trim();
  const category = String(params.category ?? "all");
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const { products, categories, totalCount } = await getProductsPageData({
    search,
    category,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const baseQuery = new URLSearchParams();

  if (search) {
    baseQuery.set("search", search);
  }

  if (category && category !== "all") {
    baseQuery.set("category", category);
  }

  return (
    <div className="space-y-5">
      <Reveal>
        <section className="premium-card soft-red-panel p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e10600]">Mmart Store</p>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Discover Fresh Grocery Picks
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Search products, filter by category, and add to cart in seconds.
          </p>
        </section>
      </Reveal>

      <ProductFilters
        categories={categories}
        initialSearch={search}
        initialCategory={category}
      />

      {products.length === 0 ? (
        <div className="premium-card border-dashed p-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
          No products found for current filters.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={index * 55}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      )}

      <PaginationControls page={page} totalPages={totalPages} baseQuery={baseQuery} />
    </div>
  );
}
