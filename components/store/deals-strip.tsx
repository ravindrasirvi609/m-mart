import Link from "next/link";
import { BadgeCheck, Tag } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/ui/reveal";
import type { Product } from "@/lib/queries";

type DealsStripProps = {
  deals: Product[];
};

/**
 * Horizontal deal strip showing products with the biggest discounts.
 * Eye-catching section designed to drive impulse purchases.
 */
export function DealsStrip({ deals }: DealsStripProps) {
  if (deals.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header with accent background */}
      <Reveal>
        <div className="premium-card flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#fff4ef] to-[#ffede5] p-3 dark:from-[#2a1b1e] dark:to-[#24181c] sm:p-4">
          <div className="flex items-center gap-3">
            <Tag className="text-[#c91510]" size={18} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c91510] sm:text-xs">
                Best Deals
              </p>
              <p className="font-heading text-base font-bold text-text-main sm:text-lg">
                Save Big on Top Products
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="text-[#c91510]" size={18} />
            <Link
              href="/products?sort=discount"
              className="text-xs font-extrabold uppercase tracking-wider text-[#c91510]"
            >
              See all →
            </Link>
          </div>
        </div>
      </Reveal>

      {/* Scrollable deals row */}
      <div className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {deals.map((product, index) => (
          <div
            key={product.id}
            className="w-[155px] flex-shrink-0 snap-start sm:w-[190px] lg:w-[220px]"
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
