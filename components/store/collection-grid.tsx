import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import type { CollectionWithProducts } from "@/lib/home-queries";

type CollectionGridProps = {
  collections: CollectionWithProducts[];
};

/**
 * Visual grid of curated collections (e.g., "Morning Essentials", "Party Pack").
 * Each card links to the products page filtered by that collection.
 */
export function CollectionGrid({ collections }: CollectionGridProps) {
  if (collections.length === 0) return null;

  return (
    <section className="space-y-4">
      <Reveal>
        <div className="flex items-center gap-2.5">
          <span className="text-xl" aria-hidden="true">
            📦
          </span>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Curated Collections
          </h2>
        </div>
      </Reveal>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {collections.map((collection, index) => (
          <Reveal key={collection.id} delay={index * 80}>
            <Link
              href={`/products?collection=${collection.slug}`}
              className="glow-on-hover premium-card group flex flex-col items-start gap-3 rounded-2xl p-5 transition"
              style={{
                background: collection.bg_color
                  ? `linear-gradient(135deg, ${collection.bg_color}22, ${collection.bg_color}08)`
                  : undefined,
              }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1eb] text-[#c91510] dark:bg-zinc-800">
                <Sparkles size={18} />
              </span>

              <div>
                <h3 className="font-heading text-base font-bold text-text-main">
                  {collection.name}
                </h3>
                {collection.description && (
                  <p className="mt-1 line-clamp-2 text-xs text-text-subtle">
                    {collection.description}
                  </p>
                )}
              </div>

              <span className="mt-auto text-xs font-bold text-[#c91510]">
                {collection.products.length > 0
                  ? `${collection.products.length} products →`
                  : "Explore →"}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
