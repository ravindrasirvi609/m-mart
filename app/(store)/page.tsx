import Link from "next/link";
import { PhoneCall, Search, MapPin } from "lucide-react";

import { ProductCard } from "@/components/store/product-card";
import { Button } from "@/components/ui/button";
import { STORE } from "@/lib/constants";
import { getHomeData } from "@/lib/queries";

export const revalidate = 120;

export default async function HomePage() {
  const { categories, featured } = await getHomeData();

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 p-6 text-white sm:p-10">
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-100">
            Grocery Delivery
          </p>
          <h1 className="max-w-xl text-3xl font-bold sm:text-5xl">
            Fresh groceries delivered from {STORE.name}
          </h1>
          <p className="max-w-2xl text-sm text-emerald-50 sm:text-base">
            Owner: {STORE.owner}. Get daily essentials delivered in Mukai Nagar,
            Hinjewadi Phase 1, Pune.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/products">
              <Button className="bg-white text-emerald-700 hover:bg-emerald-100">
                <Search size={16} className="mr-2" />
                Explore Products
              </Button>
            </Link>
            <a href={`tel:${STORE.phone}`}>
              <Button variant="secondary">
                <PhoneCall size={16} className="mr-2" />
                Call {STORE.phone}
              </Button>
            </a>
          </div>

          <form action="/products" className="mt-2 flex w-full max-w-xl gap-2">
            <input
              type="search"
              name="search"
              placeholder="Search vegetables, fruits, daily essentials..."
              className="h-11 flex-1 rounded-xl border border-white/30 bg-white/90 px-3 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none"
            />
            <Button type="submit" className="bg-zinc-900 text-white hover:bg-zinc-800">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <MapPin size={16} />
          <span>{STORE.location}</span>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-emerald-100 hover:text-emerald-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            Featured Products
          </h2>
          <Link href="/products" className="text-sm font-semibold text-emerald-700">
            View all
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
