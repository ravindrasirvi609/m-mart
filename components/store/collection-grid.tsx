import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Reveal } from "@/components/ui/reveal";
import { resolveSolidColor } from "@/lib/gradient-utils";
import type { CollectionWithProducts } from "@/lib/home-queries";

/**
 * Converts a collection bg_color (Tailwind token, hex, or gradient) to a CSS
 * `background` value for the subtle tinted card gradient.
 */
function toCollectionBg(
  bgColor: string | null | undefined,
): string | undefined {
  const c = resolveSolidColor(bgColor);
  if (!c) return undefined;
  // Already a gradient — use directly
  if (c.startsWith("linear-gradient") || c.startsWith("radial-gradient"))
    return c;
  // Hex with alpha stops (subtle light/dark fade)
  if (c.startsWith("#")) return `linear-gradient(135deg, ${c}22, ${c}08)`;
  // rgb/hsl/named colors — fallback to transparent fade
  return `linear-gradient(135deg, ${c}22, transparent)`;
}

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
          <h2 className="text-xl font-extrabold tracking-tight text-text-main sm:text-2xl">
            Curated Collections
          </h2>
        </div>
      </Reveal>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {collections.map((collection, index) => (
          <Reveal key={collection.id} delay={index * 80}>
            <Link
              href={`/products?collection=${collection.slug}`}
              className="glow-on-hover premium-card group flex flex-col items-start gap-3 rounded-2xl p-5 transition"
              style={{
                background: toCollectionBg(collection.bg_color),
              }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1eb] text-[#c91510] dark:bg-[#2a1a1d]">
                <Sparkles size={18} />
              </span>

              <div>
                <h3 className="font-heading text-sm font-bold text-text-main sm:text-base">
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
