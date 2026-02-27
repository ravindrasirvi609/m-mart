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
    deliveryEta,
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
    <div className="space-y-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── 0. Location Picker ──────────────────────────────────────── */}
      {serviceAreas.length > 0 && (
        <div className="flex items-center justify-end">
          <LocationPicker
            currentArea={userLocation.area}
            currentCity={userLocation.city}
            serviceAreas={serviceAreas}
            userId={user?.id ?? null}
          />
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
        <div className="flex flex-wrap justify-center gap-3">
          {TRUST_BADGES.map((item) => {
            const Icon = item.icon;
            return (
              <span
                key={item.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <Icon size={14} className="text-[#c91510]" />
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
      <section className="space-y-5">
        <Reveal>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Featured Categories
            </h2>
            <Link
              href="/products"
              className="text-sm font-black uppercase tracking-[0.1em] text-[#c91510]"
            >
              Explore all
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {displayCategories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Reveal key={category.name} delay={index * 70}>
                <Link
                  href={`/products?category=${encodeURIComponent(category.name)}`}
                  className="glow-on-hover premium-card flex flex-col items-center gap-3 rounded-2xl p-4 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff1eb] text-[#c91510] dark:bg-zinc-800">
                    <Icon size={24} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.08em] text-text-subtle">
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
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#c91510]">
              Today&apos;s Offer
            </p>
            <p className="font-heading text-xl font-bold text-text-main">
              Free Delivery Above ₹500
            </p>
          </div>
          <BadgeCheck className="text-[#c91510]" />
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
      <section className="space-y-5">
        <Reveal>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Trending Products
            </h2>
            <Link
              href="/products"
              className="text-sm font-black uppercase tracking-[0.1em] text-[#c91510]"
            >
              View all
            </Link>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product, index) => (
            <Reveal key={product.id} delay={index * 75}>
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
      <section className="space-y-5">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Why Choose Mmart
          </h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
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
              <Reveal key={feature.title} delay={index * 90}>
                <article className="glow-on-hover premium-card soft-red-panel rounded-2xl p-5">
                  <Icon className="text-[#c91510]" size={22} />
                  <h3 className="mt-3 font-heading text-lg font-bold text-text-main">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-text-subtle">
                    {feature.text}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ── 16. How It Works ─────────────────────────────────────────── */}
      <section className="space-y-5">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How It Works
          </h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Add Products to Cart",
            "Pay via UPI QR",
            "We Verify & Deliver",
          ].map((step, index) => (
            <Reveal key={step} delay={index * 100}>
              <article className="premium-card relative overflow-hidden p-5">
                <p className="mb-3 text-3xl font-black text-[#c91510]">
                  0{index + 1}
                </p>
                <h3 className="text-lg font-bold text-text-main">{step}</h3>
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
      <section className="space-y-5">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What Customers Say
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <TestimonialCarousel />
        </Reveal>
      </section>

      {/* ── 18. Contact & Map ────────────────────────────────────────── */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="premium-card p-6">
            <h2 className="text-2xl font-bold text-text-main">
              Visit or Contact
            </h2>
            <p className="mt-2 text-sm text-text-subtle">{STORE.name}</p>
            <p className="mt-1 text-sm text-text-subtle">{STORE.location}</p>
            <p className="mt-1 text-sm font-semibold text-text-main">
              {STORE.phone}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
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

        <Reveal delay={120}>
          <div className="premium-card soft-red-panel relative min-h-[220px] overflow-hidden p-6">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c91510]">
              Map Preview
            </p>
            <p className="mt-3 max-w-xs text-sm text-text-subtle">
              Google Maps integration placeholder. Connect your live store pin
              in deployment.
            </p>
            <div className="absolute bottom-5 right-5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#c91510] shadow dark:bg-zinc-900">
              {userLocation.area}
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
