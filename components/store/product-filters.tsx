"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
    <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-900">
      <Input
        placeholder="Search products"
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
      />

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
    </div>
  );
}
