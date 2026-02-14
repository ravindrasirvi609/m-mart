import Image from "next/image";
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
  Sparkles,
  Truck,
  Utensils,
  Wallet,
  Waves,
} from "lucide-react";

import { TestimonialCarousel } from "@/components/site/testimonial-carousel";
import { ProductCard } from "@/components/store/product-card";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/constants";
import { getHomeData } from "@/lib/queries";

export const revalidate = 120;

const fallbackCategories = [
  { name: "Vegetables", icon: Carrot },
  { name: "Fruits", icon: Apple },
  { name: "Dairy", icon: Milk },
  { name: "Snacks", icon: Package },
  { name: "Beverages", icon: Waves },
  { name: "Household", icon: Utensils },
];

const trustBadges = [
  { label: "Fast Delivery", icon: Truck },
  { label: "Fresh Products", icon: Leaf },
  { label: "Secure Payment", icon: ShieldCheck },
];

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

export default async function HomePage() {
  const { categories, featured } = await getHomeData();
  const displayCategories =
    categories.length > 0
      ? categories.slice(0, 6).map((category, index) => ({
          name: category.name,
          icon: fallbackCategories[index % fallbackCategories.length].icon,
        }))
      : fallbackCategories;

  return (
    <div className="space-y-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="hero-pattern relative overflow-hidden rounded-[2rem] px-5 py-8 text-white sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -left-10 top-14 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
        <div className="pointer-events-none absolute -right-6 bottom-10 h-28 w-28 rounded-full bg-white/20 blur-2xl" />

        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <Reveal>
            <div className="space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]">
                <Sparkles size={14} />
                Premium Grocery Experience
              </p>

              <h1 className="max-w-2xl font-display text-4xl font-black leading-tight tracking-[0.02em] sm:text-5xl lg:text-6xl">
                Fresh Groceries Delivered to Your Doorstep
              </h1>

              <p className="max-w-xl text-sm text-white/90 sm:text-base">
                Fast delivery in Mukai Nagar, Hinjewadi Phase 1, Pune. Curated quality,
                startup-speed experience, and trusted manual UPI verification.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/products">
                  <Button className="bg-white !text-[#e10600]">Shop Now</Button>
                </Link>
                <a href={`tel:${STORE.phone}`}>
                  <Button variant="outline" className="!text-white !ring-white/55 hover:!bg-white/15">
                    Call Now
                  </Button>
                </a>
              </div>

              <form action="/products" className="flex w-full max-w-xl flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  name="search"
                  placeholder="Search fruits, vegetables, essentials..."
                  className="h-11 flex-1 rounded-xl border border-white/35 bg-white/90 px-3 text-sm text-zinc-900 outline-none"
                />
                <Button type="submit" className="!bg-zinc-900">
                  Search
                </Button>
              </form>

              <div className="flex flex-wrap gap-2">
                {trustBadges.map((item) => {
                  const Icon = item.icon;

                  return (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold"
                    >
                      <Icon size={13} />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </Reveal>

          <Reveal delay={180}>
            <div className="relative">
              <div className="relative mx-auto h-[360px] w-full max-w-md overflow-hidden rounded-[1.8rem] border border-white/30 bg-white/10 p-2 backdrop-blur">
                <div className="relative h-full w-full overflow-hidden rounded-[1.4rem] bg-white">
                  <Image
                    src="https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=900&q=80"
                    alt="Fresh groceries"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="animate-float absolute -left-6 top-8 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#e10600] shadow-lg">
                10 min dispatch
              </div>
              <div className="animate-float absolute -right-4 bottom-8 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#e10600] shadow-lg [animation-delay:0.8s]">
                100% Fresh Pick
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="space-y-5">
        <Reveal>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Featured Categories</h2>
            <Link href="/products" className="text-sm font-bold uppercase tracking-[0.1em] text-[#e10600]">
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
                  className="glow-on-hover flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-white p-4 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#e10600]">
                    <Icon size={24} />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.1em] text-zinc-700">
                    {category.name}
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <Reveal>
          <div className="premium-card flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#fff4f4] to-[#ffe9e9] p-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e10600]">Today Offer</p>
              <p className="font-heading text-xl font-bold text-zinc-900">Free Delivery Above ₹500</p>
            </div>
            <BadgeCheck className="text-[#e10600]" />
          </div>
        </Reveal>

        <Reveal>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Trending Products</h2>
            <Link href="/products" className="text-sm font-bold uppercase tracking-[0.1em] text-[#e10600]">
              View all
            </Link>
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product, index) => (
            <Reveal key={product.id} delay={index * 75}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Why Choose Mmart</h2>
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
                <article className="glow-on-hover soft-red-panel rounded-2xl border border-red-100 p-5">
                  <Icon className="text-[#e10600]" size={22} />
                  <h3 className="mt-3 font-heading text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{feature.text}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="space-y-5">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How It Works</h2>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            "Add Products to Cart",
            "Pay via UPI QR",
            "We Verify & Deliver",
          ].map((step, index) => (
            <Reveal key={step} delay={index * 100}>
              <article className="premium-card relative overflow-hidden p-5">
                <p className="mb-3 text-3xl font-black text-[#e10600]">0{index + 1}</p>
                <h3 className="text-lg font-bold">{step}</h3>
                {index < 2 ? (
                  <div className="absolute right-0 top-0 hidden h-full w-8 items-center justify-center md:flex">
                    <span className="h-0.5 w-7 bg-red-200" />
                  </div>
                ) : null}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Reveal>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">What Customers Say</h2>
        </Reveal>
        <Reveal delay={100}>
          <TestimonialCarousel />
        </Reveal>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal>
          <div className="premium-card p-6">
            <h2 className="text-2xl font-bold">Visit or Contact</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{STORE.name}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{STORE.location}</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{STORE.phone}</p>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href={`tel:${STORE.phone}`}>
                <Button>
                  <PhoneCall size={14} />
                  Call Now
                </Button>
              </a>
              <a href="https://wa.me/918955872627" target="_blank" rel="noreferrer">
                <Button variant="outline">WhatsApp</Button>
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <div className="premium-card soft-red-panel relative min-h-[220px] overflow-hidden p-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#e10600]">Map Preview</p>
            <p className="mt-3 max-w-xs text-sm text-zinc-600 dark:text-zinc-300">
              Google Maps integration placeholder. Connect your live store pin in deployment.
            </p>
            <div className="absolute bottom-5 right-5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#e10600] shadow">
              Hinjewadi Phase 1
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
