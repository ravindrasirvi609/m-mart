import Link from "next/link";
import {
  Apple,
  BadgeCheck,
  Carrot,
  Clock3,
  Leaf,
  Milk,
  Package,
  PhoneCall,
  ShieldCheck,
  Truck,
  Utensils,
  Wallet,
  Waves,
} from "lucide-react";

import { BannerCarousel } from "@/components/store/banner-carousel";
import { CampaignHero } from "@/components/store/campaign-hero";
import { CollectionGrid } from "@/components/store/collection-grid";
import { DealsStrip } from "@/components/store/deals-strip";
import { DeliveryInfoBanner } from "@/components/store/delivery-info-banner";
import { GeoLocationPrompt } from "@/components/store/geo-location-prompt";
import { LocationPicker } from "@/components/store/location-picker";
import { ProductCard } from "@/components/store/product-card";
import { ProductRow } from "@/components/store/product-row";
import { RecentlyViewed } from "@/components/store/recently-viewed";
import { TestimonialCarousel } from "@/components/site/testimonial-carousel";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/auth";
import { getEnhancedHomeData } from "@/lib/home-queries";

export const revalidate = 120;

// ---------------------------------------------------------------------------
// Fallback category icons (used when DB categories lack icon metadata)
// ---------------------------------------------------------------------------
const CATEGORY_ICONS = [
  { name: "Vegetables", icon: Carrot },
  { name: "Fruits", icon: Apple },
  { name: "Dairy", icon: Milk },
  { name: "Snacks", icon: Package },
  { name: "Beverages", icon: Waves },
  { name: "Household", icon: Utensils },
];

const TRUST_BADGES = [
  { label: "Fast Delivery", icon: Truck },
  { label: "Fresh Products", icon: Leaf },
  { label: "Secure Payment", icon: ShieldCheck },
];

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "GroceryStore",
  name: STORE.name,
  telephone: STORE.phone,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Mukai Nagar, Hinjewadi Phase 1",
    addressLocality: "Pune",
    addressRegion: "Maharashtra",
    addressCountry: "IN",
  },
};

// ---------------------------------------------------------------------------
// Home Page — Dynamic, Festival-Aware, Location-Aware
// ---------------------------------------------------------------------------
export default async function HomePage() {
  const user = await getCurrentUser();
  const data = await getEnhancedHomeData(user?.id);

  const {
    categories,
    featured,
    activeCampaign,
    banners,
    bestSellers,
    deals,
    collections,
    festival,
    festivalProducts,
    timeContext,
    dayContext,
    userLocation,
    serviceAreas,
    nearestServiceArea,
    deliveryEta,
    deliveryDistanceKm,
  } = data;

  // Map category names to fallback icons
  const displayCategories =
    categories.length > 0
      ? categories.slice(0, 6).map((category, index) => ({
          name: category.name,
          icon: CATEGORY_ICONS[index % CATEGORY_ICONS.length].icon,
        }))
      : CATEGORY_ICONS;

  return (
    <div className="space-y-8 sm:space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 0. Location Picker + Delivery Info ────────────────────── */}
      {serviceAreas.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-end">
            <LocationPicker
              currentArea={userLocation.area}
              currentCity={userLocation.city}
              serviceAreas={serviceAreas}
              userId={user?.id ?? null}
            />
          </div>

          {/* Delivery info strip — visible when ETA or distance is known */}
          {(deliveryEta != null || deliveryDistanceKm != null) && (
            <DeliveryInfoBanner
              area={userLocation.area}
              deliveryEta={deliveryEta}
              distanceKm={deliveryDistanceKm}
              deliveryFee={nearestServiceArea?.delivery_fee ?? null}
              minOrderFreeDelivery={
                nearestServiceArea?.min_order_free_delivery ?? null
              }
            />
          )}
        </div>
      )}

      {/* ── 1. Dynamic Hero (Campaign / Festival / Default) ────────── */}
      <CampaignHero
        campaign={activeCampaign}
        festival={festival}
        userLocation={userLocation}
        deliveryEta={deliveryEta}
      />

      {/* ── 2. Trust Badges ─────────────────────────────────────────── */}
      <Reveal>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {TRUST_BADGES.map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-red/10 bg-surface-elevated px-3 py-1.5 text-[11px] font-bold text-text-main shadow-sm sm:px-4 sm:py-2 sm:text-xs"
              >
                <Icon size={13} className="text-[#c91510]" />
                {item.label}
              </span>
            );
          })}
        </div>
      </Reveal>

      {/* ── 3. Promotional Banners Carousel ─────────────────────────── */}
      {banners.length > 0 && (
        <Reveal>
          <BannerCarousel banners={banners} />
        </Reveal>
      )}

      {/* ── 4. Featured Categories ──────────────────────────────────── */}
      <section className="space-y-4">
        <Reveal>
          <div className="section-header">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Featured Categories
            </h2>
            <Link
              href="/products"
              className="text-xs font-extrabold uppercase tracking-wider text-[#c91510] sm:text-sm"
            >
              See all →
            </Link>
          </div>
        </Reveal>

        <div className="scrollbar-hide -mx-1 flex gap-3 overflow-x-auto px-1 pb-1 sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-6">
          {displayCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Reveal key={category.name} delay={index * 50}>
                <Link
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  className="category-pill min-w-[5rem] shrink-0 sm:min-w-0"
                >
                  <span className="category-pill-icon">
                    <Icon size={22} />
                  </span>
                  <span className="text-[11px] font-bold text-text-main sm:text-xs">
                    {category.name}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── 5. Festival Special Products ─────────────────────────────── */}
      {festival && festivalProducts.length > 0 && (
        <ProductRow
          title={`${festival.name} Specials`}
          icon={festival.icon}
          badge="FESTIVE"
          products={festivalProducts}
          viewAllHref={`/products?tags=${festival.tags.slice(0, 3).join(",")}`}
          accentBg
        />
      )}

      {/* ── 6. Campaign Products ─────────────────────────────────────── */}
      {activeCampaign && activeCampaign.products.length > 0 && (
        <ProductRow
          title={activeCampaign.name}
          badge={activeCampaign.badge_text ?? "PROMO"}
          products={activeCampaign.products}
          viewAllHref={`/products?campaign=${activeCampaign.slug}`}
        />
      )}

      {/* ── 7. Time-of-Day Suggestions ───────────────────────────────── */}
      <ProductRow
        title={timeContext.label}
        icon={timeContext.icon}
        products={featured.slice(0, 6)}
        viewAllHref={`/products?tags=${timeContext.tags.slice(0, 3).join(",")}`}
      />

      {/* ── 8. Today's Offer Banner ──────────────────────────────────── */}
      <Reveal>
        <div className="premium-card flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#fff4ef] to-[#ffede5] p-4 dark:from-[#2a1b1e] dark:to-[#24181c]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c91510] sm:text-xs">
              Today&apos;s Offer
            </p>
            <p className="font-heading text-lg font-bold text-text-main sm:text-xl">
              Free Delivery Above ₹500
            </p>
          </div>
          <BadgeCheck className="text-[#c91510]" size={22} />
        </div>
      </Reveal>

      {/* ── 9. Best Sellers ──────────────────────────────────────────── */}
      {bestSellers.length > 0 && (
        <ProductRow
          title="Best Sellers"
          icon="🔥"
          badge="POPULAR"
          products={bestSellers}
          viewAllHref="/products?sort=popular"
        />
      )}

      {/* ── 10. Deals Strip ──────────────────────────────────────────── */}
      <DealsStrip deals={deals} />

      {/* ── 11. Trending / Latest Products (Grid) ────────────────────── */}
      <section className="space-y-4">
        <Reveal>
          <div className="section-header">
            <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
              Trending Products
            </h2>
            <Link
              href="/products"
              className="text-xs font-extrabold uppercase tracking-wider text-[#c91510] sm:text-sm"
            >
              View all →
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product, index) => (
            <Reveal key={product.id} delay={index * 60}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 12. Day-of-Week Picks ────────────────────────────────────── */}
      <ProductRow
        title={dayContext.label}
        icon={dayContext.icon}
        products={featured.slice(0, 5)}
        viewAllHref={`/products?tags=${dayContext.tags.slice(0, 3).join(",")}`}
      />

      {/* ── 13. Curated Collections ──────────────────────────────────── */}
      <CollectionGrid collections={collections} />

      {/* ── 14. Recently Viewed (Client-side) ────────────────────────── */}
      <RecentlyViewed />

      {/* ── 15. Why Choose Mmart ─────────────────────────────────────── */}
      <section className="space-y-4">
        <Reveal>
          <h2 className="text-xl font-extrabold tracking-tight text-text-main sm:text-2xl">
            Why Choose Mmart
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            {
              title: "Same Day Delivery",
              text: "Orders are processed quickly and dispatched with priority.",
              icon: Clock3,
            },
            {
              title: "Fresh Quality Products",
              text: "Daily handpicked inventory with strict freshness checks.",
              icon: Leaf,
            },
            {
              title: "Secure UPI Payments",
              text: "Manual verification adds trust and payment transparency.",
              icon: Wallet,
            },
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={index * 80}>
                <article className="premium-card soft-red-panel rounded-2xl p-4 sm:p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff1eb] dark:bg-[#2a1a1d]">
                    <Icon className="text-[#c91510]" size={20} />
                  </div>
                  <h3 className="mt-3 font-heading text-base font-bold text-text-main sm:text-lg">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-subtle">
                    {feature.text}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── 16. How It Works ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <Reveal>
          <h2 className="text-xl font-extrabold tracking-tight text-text-main sm:text-2xl">
            How It Works
          </h2>
        </Reveal>

        <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {[
            "Add Products to Cart",
            "Pay via UPI QR",
            "We Verify & Deliver",
          ].map((step, index) => (
            <Reveal key={step} delay={index * 80}>
              <article className="premium-card relative overflow-hidden p-4 sm:p-5">
                <p className="mb-2 text-2xl font-black text-[#c91510] sm:text-3xl">
                  0{index + 1}
                </p>
                <h3 className="text-base font-bold text-text-main sm:text-lg">
                  {step}
                </h3>
                {index < 2 ? (
                  <div className="absolute right-0 top-0 hidden h-full w-8 items-center justify-center md:flex">
                    <span className="h-0.5 w-7 bg-[#c91510]/25" />
                  </div>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 17. Testimonials ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <Reveal>
          <h2 className="text-xl font-extrabold tracking-tight text-text-main sm:text-2xl">
            What Customers Say
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <TestimonialCarousel />
        </Reveal>
      </section>

      {/* ── 18. Contact & Map ────────────────────────────────────────── */}
      <section className="grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="premium-card p-5 sm:p-6">
            <h2 className="text-xl font-extrabold text-text-main sm:text-2xl">
              Visit or Contact
            </h2>
            <p className="mt-2 text-sm text-text-subtle">{STORE.name}</p>
            <p className="mt-1 text-sm text-text-subtle">{STORE.location}</p>
            <p className="mt-1 text-sm font-semibold text-text-main">
              {STORE.phone}
            </p>

            <div className="mt-4 flex flex-wrap gap-3 sm:mt-5">
              <a href={`tel:${STORE.phone}`}>
                <Button>
                  <PhoneCall size={14} />
                  Call Now
                </Button>
              </a>
              <a
                href="https://wa.me/918955872627"
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="outline">WhatsApp</Button>
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="premium-card soft-red-panel relative min-h-[200px] overflow-hidden p-5 sm:min-h-[220px] sm:p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#c91510] sm:text-xs">
              Map Preview
            </p>
            <p className="mt-3 max-w-xs text-sm text-text-subtle">
              Google Maps integration placeholder. Connect your live store pin
              in deployment.
            </p>
            <div className="absolute bottom-4 right-4 rounded-xl bg-surface-elevated px-3 py-2 text-xs font-bold text-[#c91510] shadow sm:bottom-5 sm:right-5">
              {userLocation.area}
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Geo-Location Prompt (first-visit GPS banner) ────────────── */}
      <GeoLocationPrompt userId={user?.id ?? null} />
    </div>
  );
}
