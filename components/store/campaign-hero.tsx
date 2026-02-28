import Image from "next/image";
import Link from "next/link";
import { MapPin, Sparkles, Truck } from "lucide-react";

import { CountdownTimer } from "@/components/store/countdown-timer";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { STORE } from "@/lib/constants";
import type { FestivalContext } from "@/lib/festivals";
import { resolveGradientStyle } from "@/lib/gradient-utils";
import type { CampaignWithProducts } from "@/lib/home-queries";
import type { UserLocation } from "@/lib/location";

type CampaignHeroProps = {
  campaign: CampaignWithProducts | null;
  festival: FestivalContext | null;
  userLocation: UserLocation;
  deliveryEta: number | null;
};

/**
 * Dynamic hero section that adapts to:
 *   1. Active DB campaign → campaign theme + countdown
 *   2. Active festival (from calendar engine) → festival gradient + greeting
 *   3. Default → standard Mmart branding
 */
export function CampaignHero({
  campaign,
  festival,
  userLocation,
  deliveryEta,
}: CampaignHeroProps) {
  // Determine display values from campaign > festival > defaults
  const heroTitle =
    campaign?.hero_title ??
    festival?.greeting ??
    "Fresh Groceries Delivered with Speed and Clarity";

  const heroSubtitle =
    campaign?.hero_subtitle ??
    (festival
      ? `Special ${festival.name} collection — curated for your celebrations`
      : "Shop daily essentials with smooth browsing, secure UPI verification, and fast local delivery in Pune.");

  const badgeText =
    campaign?.badge_text ??
    (festival
      ? `${festival.icon} ${festival.name.toUpperCase()} SPECIAL`
      : "Online Grocery. App-like Experience.");

  const discountLabel = campaign?.discount_label ?? null;

  const heroImageUrl =
    campaign?.hero_image_url ??
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?q=80&w=2148&auto=format&fit=crop";

  const shopLink = campaign
    ? `/products?campaign=${campaign.slug}`
    : festival
      ? `/products?tags=${festival.tags.slice(0, 3).join(",")}`
      : "/products";

  const shopLabel = campaign
    ? `Shop ${campaign.name}`
    : festival
      ? `Shop ${festival.name} Deals`
      : "Start Shopping";

  // Resolve gradient: converts Tailwind `from-X to-Y` or raw CSS → inline style value
  const rawGradient =
    campaign?.hero_bg_gradient ?? (festival ? festival.heroGradient : null);
  const gradientStyle = resolveGradientStyle(rawGradient);

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] px-5 py-8 text-white sm:px-10 sm:py-14${gradientStyle ? "" : " hero-pattern"}`}
      style={gradientStyle ? { background: gradientStyle } : undefined}
    >
      {/* Decorative blurs */}
      <div className="pointer-events-none absolute -left-10 top-14 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
      <div className="pointer-events-none absolute -right-6 bottom-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

      {/* Festival particle decoration */}
      {festival && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute animate-float text-2xl opacity-20"
              style={{
                left: `${15 + i * 14}%`,
                top: `${10 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              {festival.icon}
            </span>
          ))}
        </div>
      )}

      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <Reveal>
          <div className="space-y-5">
            {/* Badge */}
            <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em]">
              <Sparkles size={14} />
              {badgeText}
            </p>

            {/* Location indicator */}
            <div className="flex items-center gap-2 text-sm text-white/85">
              <MapPin size={14} />
              <span className="font-semibold">
                Delivering to {userLocation.area}, {userLocation.city}
              </span>
              {deliveryEta && (
                <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-bold">
                  <Truck size={11} />~{deliveryEta} min
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="max-w-2xl font-display text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>

            {/* Subtitle */}
            <p className="max-w-xl text-sm text-white/90 sm:text-base">
              {heroSubtitle}
            </p>

            {/* Discount label + countdown */}
            {(discountLabel || campaign) && (
              <div className="flex flex-wrap items-center gap-4">
                {discountLabel && (
                  <span className="rounded-full bg-white/25 px-4 py-1.5 text-sm font-black tracking-wide text-white">
                    {discountLabel}
                  </span>
                )}
                {campaign && <CountdownTimer endsAt={campaign.ends_at} />}
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link href={shopLink}>
                <Button className="bg-white !text-[#c91510] hover:bg-white/90">
                  {shopLabel}
                </Button>
              </Link>
              <a href={`tel:${STORE.phone}`}>
                <Button
                  variant="outline"
                  className="!text-white !ring-white/55 hover:!bg-white/15"
                >
                  Call Now
                </Button>
              </a>
            </div>

            {/* Search */}
            <form
              action="/products"
              className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
            >
              <input
                type="search"
                name="search"
                placeholder="Search fruits, vegetables, essentials..."
                className="h-11 flex-1 rounded-xl border border-white/35 bg-white/95 px-3 text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400 dark:bg-zinc-900/95 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
              <Button type="submit" className="!bg-zinc-900">
                Search
              </Button>
            </form>
          </div>
        </Reveal>

        <Reveal delay={180}>
          <div className="relative">
            <div className="relative mx-auto h-[360px] w-full max-w-md overflow-hidden rounded-[1.8rem] border border-white/30 bg-white/10 p-2 backdrop-blur">
              <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-white dark:bg-zinc-900">
                <Image
                  src={heroImageUrl}
                  alt={heroTitle}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Floating badges */}
            <div className="animate-float absolute -left-6 top-8 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#c91510] shadow-lg dark:bg-zinc-900 dark:text-[#ff8a6e]">
              {deliveryEta ? `${deliveryEta} min delivery` : "Fast dispatch"}
            </div>
            <div className="animate-float absolute -right-4 bottom-8 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#c91510] shadow-lg [animation-delay:0.8s] dark:bg-zinc-900 dark:text-[#ff8a6e]">
              {festival
                ? `${festival.icon} ${festival.name}`
                : "100% Fresh Pick"}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
