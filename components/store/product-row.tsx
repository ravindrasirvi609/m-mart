"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/ui/reveal";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/queries";

type ProductRowProps = {
  /** Section heading */
  title: string;
  /** Products to display */
  products: Product[];
  /** Optional "View all" link */
  viewAllHref?: string;
  /** Small badge next to title (e.g. "NEW", "🔥 Hot") */
  badge?: string;
  /** Emoji icon prefix for the title */
  icon?: string;
  /** Optional accent background for the section */
  accentBg?: boolean;
  className?: string;
};

/**
 * Horizontally scrollable product row with smooth scroll buttons.
 * Reusable for festival picks, best sellers, time-of-day sections, etc.
 */
export function ProductRow({
  title,
  products,
  viewAllHref,
  badge,
  icon,
  accentBg = false,
  className,
}: ProductRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (products.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({
      left: direction === "right" ? amount : -amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      className={cn(
        "space-y-4",
        accentBg &&
          "rounded-2xl bg-gradient-to-r from-[#fff4ef] to-[#ffede5] p-5 dark:from-[#1d1618] dark:to-[#1a1417]",
        className,
      )}
    >
      <Reveal>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {icon && (
              <span className="text-xl" aria-hidden="true">
                {icon}
              </span>
            )}
            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
              {title}
            </h2>
            {badge && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/30 dark:text-red-400">
                {badge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Scroll arrows (hidden on mobile — use swipe instead) */}
            {products.length > 3 && (
              <div className="hidden gap-1 sm:flex">
                <button
                  type="button"
                  onClick={() => scroll("left")}
                  className="rounded-full border border-zinc-200 p-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  aria-label={`Scroll ${title} left`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => scroll("right")}
                  className="rounded-full border border-zinc-200 p-1.5 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  aria-label={`Scroll ${title} right`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {viewAllHref && (
              <Link
                href={viewAllHref}
                className="text-sm font-black uppercase tracking-[0.1em] text-[#c91510] transition hover:opacity-80"
              >
                View all
              </Link>
            )}
          </div>
        </div>
      </Reveal>

      <div
        ref={scrollRef}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2"
        role="list"
        aria-label={title}
      >
        {products.map((product, index) => (
          <div
            key={product.id}
            className="w-[180px] flex-shrink-0 snap-start sm:w-[210px] lg:w-[240px]"
            role="listitem"
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
