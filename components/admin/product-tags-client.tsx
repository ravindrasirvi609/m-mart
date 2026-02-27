"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Tag, Search } from "lucide-react";
import { DataTable } from "@/components/admin/ui/data-table";
import { Modal } from "@/components/admin/ui/modal";
import { Badge } from "@/components/admin/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import { DeleteEntityButton } from "@/components/admin/delete-entity-button";
import {
  addProductTagAction,
  bulkAddProductTagsAction,
} from "@/actions/campaign-actions";
import type { ProductTagRow, Product } from "@/lib/queries";

type ProductLite = Pick<Product, "id" | "name" | "image_url">;

interface ProductTagsClientProps {
  tags: ProductTagRow[];
  products: ProductLite[];
}

/* ─────────── Predefined tag suggestions ─────────── */
const TAG_SUGGESTIONS = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "beverages",
  "dairy",
  "bakery",
  "organic",
  "festive",
  "diwali",
  "holi",
  "navratri",
  "summer",
  "monsoon",
  "winter",
  "weekend",
  "healthy",
  "quick-meal",
  "party",
  "kids",
  "essentials",
  "best-seller",
  "new-arrival",
  "premium",
  "budget",
];

export function ProductTagsClient({ tags, products }: ProductTagsClientProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [filterTag, setFilterTag] = useState("");

  // Build a product lookup map
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Get unique tags for the filter
  const uniqueTags = [...new Set(tags.map((t) => t.tag))].sort();

  // Filter tags
  const filteredTags = filterTag
    ? tags.filter((t) => t.tag === filterTag)
    : tags;

  const columns = [
    {
      header: "Product",
      accessorKey: "product_id",
      cell: (item: ProductTagRow) => {
        const product = productMap.get(item.product_id);
        return (
          <div className="flex items-center gap-3">
            {product?.image_url ? (
              <img
                src={product.image_url}
                alt=""
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
                <Tag size={14} className="text-text-subtle" />
              </div>
            )}
            <span className="font-medium text-text-main truncate">
              {product?.name ?? "Unknown product"}
            </span>
          </div>
        );
      },
    },
    {
      header: "Tag",
      accessorKey: "tag",
      cell: (item: ProductTagRow) => <Badge variant="info">{item.tag}</Badge>,
    },
    {
      header: "Tag ID",
      accessorKey: "id",
      cell: (item: ProductTagRow) => (
        <span className="font-mono text-[10px] text-text-subtle">
          {item.id.slice(0, 8)}...
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-black text-text-main sm:text-2xl">
            Product Tags
          </h1>
          <p className="text-xs text-text-subtle sm:text-sm">
            Tag products for time-of-day, festival, and seasonal context
            matching.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsBulkOpen(true)}
            variant="outline"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-bold sm:w-auto"
          >
            <Tag size={16} />
            <span>Bulk Add</span>
          </Button>
          <Button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 font-bold text-white hover:bg-brand-red/90 sm:w-auto"
          >
            <Plus size={18} />
            <span>Add Tag</span>
          </Button>
        </div>
      </div>

      {/* Tag filter chips */}
      {uniqueTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTag("")}
            className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
              !filterTag
                ? "border-brand-red/30 bg-brand-red/10 text-brand-red"
                : "border-admin-border text-text-subtle hover:text-text-main"
            }`}
          >
            All ({tags.length})
          </button>
          {uniqueTags.map((tag) => {
            const count = tags.filter((t) => t.tag === tag).length;
            return (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? "" : tag)}
                className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  filterTag === tag
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                    : "border-admin-border text-text-subtle hover:text-text-main"
                }`}
              >
                {tag} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Table */}
      <DataTable
        data={filteredTags}
        columns={columns}
        searchKey="tag"
        renderActions={(item) => (
          <DeleteEntityButton
            id={item.id}
            entityName="tag"
            action="deleteProductTag"
          />
        )}
      />

      {/* Add Single Tag Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add Product Tag"
        description="Assign a contextual tag to a product."
      >
        <SingleTagForm
          products={products}
          onSuccess={() => setIsAddOpen(false)}
        />
      </Modal>

      {/* Bulk Add Modal */}
      <Modal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        title="Bulk Add Tags"
        description="Add multiple tags to a product at once."
      >
        <BulkTagForm
          products={products}
          onSuccess={() => setIsBulkOpen(false)}
        />
      </Modal>
    </div>
  );
}

/* ─────────── Single Tag Form ─────────── */

function SingleTagForm({
  products,
  onSuccess,
}: {
  products: ProductLite[];
  onSuccess: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(addProductTagAction, null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      onSuccess();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  const filtered = search
    ? products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      )
    : products;

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Product *
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
            size={16}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-xl border border-admin-border bg-white/5 pl-10 pr-4 text-sm text-text-main focus:border-brand-red/50 focus:outline-none mb-2"
          />
        </div>
        <select
          name="product_id"
          required
          disabled={isPending}
          className="h-10 w-full rounded-xl border border-admin-border bg-white/5 px-3 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
          size={6}
        >
          {filtered.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Tag *
        </label>
        <Input
          name="tag"
          required
          placeholder="e.g. breakfast, festive, diwali"
          className="!bg-white/5 !text-text-main"
          disabled={isPending}
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {TAG_SUGGESTIONS.slice(0, 12).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                const input = e.currentTarget
                  .closest("form")
                  ?.querySelector<HTMLInputElement>('input[name="tag"]');
                if (input) input.value = tag;
              }}
              className="rounded-full border border-admin-border px-2 py-0.5 text-[10px] text-text-subtle hover:border-brand-red/30 hover:text-brand-red transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <ActionFeedback
        state={state}
        successFallback="Tag added."
        errorFallback="Unable to add tag."
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Adding..." : "Add Tag"}
        </Button>
      </div>
    </form>
  );
}

/* ─────────── Bulk Tag Form ─────────── */

function BulkTagForm({
  products,
  onSuccess,
}: {
  products: ProductLite[];
  onSuccess: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    bulkAddProductTagsAction,
    null,
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      setSelectedTags([]);
      onSuccess();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Product *
        </label>
        <select
          name="product_id"
          required
          disabled={isPending}
          className="h-10 w-full rounded-xl border border-admin-border bg-white/5 px-3 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
        >
          <option value="">Select a product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <input type="hidden" name="tags" value={selectedTags.join(",")} />

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Select Tags
        </label>
        <div className="flex flex-wrap gap-2 rounded-xl border border-admin-border p-3">
          {TAG_SUGGESTIONS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-brand-red/40 bg-brand-red/10 text-brand-red"
                    : "border-admin-border text-text-subtle hover:text-text-main hover:border-white/20"
                }`}
              >
                {isSelected && "✓ "}
                {tag}
              </button>
            );
          })}
        </div>
        {selectedTags.length > 0 && (
          <p className="text-[11px] text-text-subtle">
            {selectedTags.length} tag(s) selected:{" "}
            <span className="text-brand-red">{selectedTags.join(", ")}</span>
          </p>
        )}
      </div>

      <ActionFeedback
        state={state}
        successFallback="Tags added."
        errorFallback="Unable to add tags."
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || selectedTags.length === 0}>
          {isPending ? "Adding..." : `Add ${selectedTags.length} Tag(s)`}
        </Button>
      </div>
    </form>
  );
}
