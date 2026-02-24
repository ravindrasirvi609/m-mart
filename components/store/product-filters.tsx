"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Category } from "@/lib/queries";

type ProductFiltersProps = {
  categories: Category[];
  initialSearch: string;
  initialCategory: string;
};

export function ProductFilters({
  categories,
  initialSearch,
  initialCategory,
}: ProductFiltersProps) {
  const [searchValue, setSearchValue] = useState(initialSearch);
  const [categoryValue, setCategoryValue] = useState(initialCategory || "all");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const baseParams = useMemo(() => new URLSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(baseParams);

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      } else {
        params.delete("search");
      }

      params.delete("page");
      router.push(`${pathname}?${params.toString()}`);
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchValue, baseParams, pathname, router]);

  return (
    <section className="premium-card grid gap-3 p-4 sm:grid-cols-[1fr_0.65fr] sm:items-end">
      <label className="block space-y-2">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-text-subtle">
          <Search size={14} />
          Search Products
        </span>
        <Input
          placeholder="Search fruits, dairy, daily essentials..."
          value={searchValue}
          className="pl-3"
          onChange={(event) => setSearchValue(event.target.value)}
        />
      </label>

      <label className="block space-y-2">
        <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-text-subtle">
          <SlidersHorizontal size={14} />
          Category
        </span>
        <Select
          value={categoryValue}
          onChange={(event) => {
            const value = event.target.value;
            setCategoryValue(value);

            const params = new URLSearchParams(baseParams);
            if (value === "all") {
              params.delete("category");
            } else {
              params.set("category", value);
            }
            params.delete("page");
            router.push(`${pathname}?${params.toString()}`);
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </Select>
      </label>
    </section>
  );
}
