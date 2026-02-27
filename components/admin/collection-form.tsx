"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { upsertCollectionAction } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import type { CollectionRow } from "@/lib/queries";

interface CollectionFormProps {
  collection?: CollectionRow;
  onSuccess?: () => void;
}

export function CollectionForm({ collection, onSuccess }: CollectionFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    upsertCollectionAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      onSuccess?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {collection && <input type="hidden" name="id" value={collection.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Name *
          </label>
          <Input
            name="name"
            required
            defaultValue={collection?.name}
            placeholder="Weekend Essentials"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Slug *
          </label>
          <Input
            name="slug"
            required
            defaultValue={collection?.slug}
            placeholder="weekend-essentials"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Description
        </label>
        <textarea
          name="description"
          defaultValue={collection?.description ?? ""}
          placeholder="A short description for the collection card..."
          disabled={isPending}
          rows={2}
          className="w-full rounded-xl border border-admin-border bg-white/5 px-3 py-2.5 text-sm text-text-main focus:border-brand-red/50 focus:outline-none resize-none"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Icon Name
          </label>
          <Input
            name="icon_name"
            defaultValue={collection?.icon_name ?? ""}
            placeholder="ShoppingBasket"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
          <p className="text-[10px] text-text-subtle">
            Lucide icon name (e.g. ShoppingBasket, Coffee, Leaf)
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Background Color
          </label>
          <Input
            id="collection-bg-color"
            name="bg_color"
            defaultValue={collection?.bg_color ?? ""}
            placeholder="#f97316  or  orange-500"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
          {/* Quick-pick solid color swatches */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "Red", value: "#dc2626" },
              { label: "Orange", value: "#f97316" },
              { label: "Amber", value: "#f59e0b" },
              { label: "Green", value: "#22c55e" },
              { label: "Teal", value: "#14b8a6" },
              { label: "Blue", value: "#3b82f6" },
              { label: "Violet", value: "#8b5cf6" },
              { label: "Pink", value: "#ec4899" },
              { label: "Rose", value: "#f43f5e" },
              { label: "Emerald", value: "#10b981" },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                title={`${label} (${value})`}
                disabled={isPending}
                onClick={() => {
                  const el = document.getElementById(
                    "collection-bg-color",
                  ) as HTMLInputElement | null;
                  if (el) el.value = value;
                }}
                className="h-6 w-6 rounded-full border-2 border-admin-border hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-brand-red/50"
                style={{ backgroundColor: value }}
                aria-label={label}
              />
            ))}
          </div>
          <p className="text-[10px] text-text-subtle">
            Hex (#f97316) or Tailwind token (orange-500). Used as a tinted card
            gradient — pick a vibrant hue.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Sort Order
          </label>
          <Input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={collection?.sort_order ?? 0}
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-3">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={collection?.is_active ?? true}
          disabled={isPending}
          id="collection-active"
          className="h-4 w-4 rounded border-admin-border accent-brand-red"
        />
        <label
          htmlFor="collection-active"
          className="text-sm font-medium text-text-main"
        >
          Collection is active
        </label>
      </div>

      <ActionFeedback
        state={state}
        successFallback="Collection saved successfully."
        errorFallback="Unable to save collection."
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : collection
              ? "Update Collection"
              : "Create Collection"}
        </Button>
      </div>
    </form>
  );
}
