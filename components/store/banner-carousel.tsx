"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  bg_color: string | null;
};

type BannerCarouselProps = {
  banners: Banner[];
  /** Auto-rotate interval in ms (default: 5000) */
  interval?: number;
  className?: string;
};

/**
 * Auto-rotating promotional banner carousel with swipe support,
 * keyboard navigation, and pause-on-hover behavior.
 */
export function BannerCarousel({
  banners,
  interval = 5000,
  className,
}: BannerCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef(0);

  const count = banners.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrent(((index % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-rotate
  useEffect(() => {
    if (paused || count <= 1) return;

    timerRef.current = setInterval(next, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [next, paused, count, interval]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [prev, next],
  );

  if (count === 0) return null;

  return (
    <div
      className={cn("group relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onKeyDown={handleKeyDown}
      role="region"
      aria-label="Promotional banners"
      aria-roledescription="carousel"
      tabIndex={0}
    >
      {/* Slides */}
      <div className="relative h-[180px] overflow-hidden rounded-2xl sm:h-[220px] lg:h-[260px]">
        {banners.map((banner, index) => {
          const isActive = index === current;

          const slideContent = (
            <div
              className="relative h-full w-full overflow-hidden rounded-2xl"
              style={{
                backgroundColor: banner.bg_color ?? "#fff4ef",
              }}
            >
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 1180px"
                priority={index === 0}
              />

              {/* Overlay with text */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6">
                <p className="text-lg font-bold text-white sm:text-2xl">
                  {banner.title}
                </p>
                {banner.subtitle && (
                  <p className="mt-1 text-sm text-white/85">
                    {banner.subtitle}
                  </p>
                )}
              </div>
            </div>
          );

          const sharedClassName = cn(
            "absolute inset-0 block transition-all duration-500 ease-in-out",
            isActive
              ? "translate-x-0 opacity-100"
              : index > current
                ? "translate-x-full opacity-0"
                : "-translate-x-full opacity-0",
          );

          const touchHandlers = {
            onTouchStart: (e: React.TouchEvent) => {
              touchStartRef.current = e.touches[0].clientX;
            },
            onTouchEnd: (e: React.TouchEvent) => {
              const diff = touchStartRef.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 60) {
                diff > 0 ? next() : prev();
              }
            },
          };

          return banner.link_url ? (
            <Link
              key={banner.id}
              href={banner.link_url}
              className={sharedClassName}
              aria-label={`Slide ${index + 1} of ${count}: ${banner.title}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              {...touchHandlers}
            >
              {slideContent}
            </Link>
          ) : (
            <div
              key={banner.id}
              className={sharedClassName}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${index + 1} of ${count}: ${banner.title}`}
              aria-hidden={!isActive}
              {...touchHandlers}
            >
              {slideContent}
            </div>
          );
        })}
      </div>

      {/* Navigation arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-zinc-800/90"
            aria-label="Previous banner"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 dark:bg-zinc-800/90"
            aria-label="Next banner"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {banners.map((_, index) => (
            <button
              key={banners[index].id}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === current
                  ? "w-6 bg-[#c91510]"
                  : "w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600",
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
