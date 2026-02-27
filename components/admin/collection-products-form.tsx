"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";

import { updateCollectionProductsAction } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import type { Product } from "@/lib/queries";

type ProductLite = Pick<
  Product,
  "id" | "name" | "image_url" | "price" | "discount_price"
>;

interface CollectionProductsFormProps {
  collectionId: string;
  allProducts: ProductLite[];
  onSuccess?: () => void;
}

export function CollectionProductsForm({
  collectionId,
  allProducts,
  onSuccess,
}: CollectionProductsFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [state, action, isPending] = useActionState(
    updateCollectionProductsAction,
    null,
  );

  useEffect(() => {
    let mounted = true;
    fetch(`/api/admin/entity-products?collection_id=${collectionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (mounted && data.items) {
          setSelectedIds(
            data.items.map((i: { product_id: string }) => i.product_id),
          );
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [collectionId]);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      onSuccess?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const filtered = search
    ? allProducts.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allProducts;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-red border-t-transparent" />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="collection_id" value={collectionId} />
      <input
        type="hidden"
        name="product_ids"
        value={JSON.stringify(selectedIds)}
      />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            size={16}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-admin-border bg-white/5 pl-10 pr-4 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
          />
        </div>
        <span className="text-xs font-bold text-text-subtle">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl border border-admin-border p-2">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-text-subtle">
            No products found.
          </p>
        )}
        {filtered.map((product) => {
          const isSelected = selectedIds.includes(product.id);
          return (
            <button
              key={product.id}
              type="button"
              onClick={() => toggle(product.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                isSelected
                  ? "bg-brand-red/10 ring-1 ring-brand-red/30"
                  : "hover:bg-white/5"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                  isSelected
                    ? "border-brand-red bg-brand-red text-white"
                    : "border-admin-border"
                }`}
              >
                {isSelected && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt=""
                  className="h-8 w-8 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-main">
                  {product.name}
                </p>
                <p className="text-[11px] text-text-subtle">
                  ₹{product.price}
                  {product.discount_price && (
                    <span className="ml-1 text-emerald-400">
                      → ₹{product.discount_price}
                    </span>
                  )}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <ActionFeedback
        state={state}
        successFallback="Products updated."
        errorFallback="Unable to update products."
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save Products"}
        </Button>
      </div>
    </form>
  );
}
