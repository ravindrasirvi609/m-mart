"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { upsertBannerAction } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import type { BannerRow } from "@/lib/queries";

interface BannerFormProps {
  banner?: BannerRow;
  onSuccess?: () => void;
}

export function BannerForm({ banner, onSuccess }: BannerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(upsertBannerAction, null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message);
      formRef.current?.reset();
      onSuccess?.();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  const toDateTimeLocal = (iso: string) => {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {banner && <input type="hidden" name="id" value={banner.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Title *
          </label>
          <Input
            name="title"
            required
            defaultValue={banner?.title}
            placeholder="Weekend Special Offer"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Subtitle
          </label>
          <Input
            name="subtitle"
            defaultValue={banner?.subtitle ?? ""}
            placeholder="Get fresh veggies at 20% off"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Image URL *
        </label>
        <Input
          name="image_url"
          type="url"
          required
          defaultValue={banner?.image_url}
          placeholder="https://your-image-url.com/banner.jpg"
          className="!bg-white/5 !text-text-main"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Link URL
          </label>
          <Input
            name="link_url"
            type="url"
            defaultValue={banner?.link_url ?? ""}
            placeholder="https://mmart.com/products?category=fruits"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Background Color
          </label>
          <Input
            name="bg_color"
            defaultValue={banner?.bg_color ?? ""}
            placeholder="#ff6a3f or bg-orange-600"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Location Area
          </label>
          <Input
            name="location_area"
            defaultValue={banner?.location_area ?? ""}
            placeholder="Leave empty for all areas"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Sort Order
          </label>
          <Input
            name="sort_order"
            type="number"
            min={0}
            defaultValue={banner?.sort_order ?? 0}
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="flex items-end pb-0.5">
          <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-2.5 w-full">
            <input
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={banner?.is_active ?? true}
              disabled={isPending}
              id="banner-active"
              className="h-4 w-4 rounded border-admin-border accent-brand-red"
            />
            <label
              htmlFor="banner-active"
              className="text-sm font-medium text-text-main"
            >
              Active
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Starts At *
          </label>
          <input
            name="starts_at"
            type="datetime-local"
            required
            defaultValue={
              banner?.starts_at ? toDateTimeLocal(banner.starts_at) : ""
            }
            disabled={isPending}
            className="h-10 w-full rounded-xl border border-admin-border bg-white/5 px-3 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Ends At *
          </label>
          <input
            name="ends_at"
            type="datetime-local"
            required
            defaultValue={
              banner?.ends_at ? toDateTimeLocal(banner.ends_at) : ""
            }
            disabled={isPending}
            className="h-10 w-full rounded-xl border border-admin-border bg-white/5 px-3 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
          />
        </div>
      </div>

      {banner?.image_url && (
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Preview
          </label>
          <img
            src={banner.image_url}
            alt={banner.title}
            className="h-32 w-full rounded-xl object-cover ring-1 ring-admin-border"
          />
        </div>
      )}

      <ActionFeedback
        state={state}
        successFallback="Banner saved successfully."
        errorFallback="Unable to save banner."
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : banner ? "Update Banner" : "Create Banner"}
        </Button>
      </div>
    </form>
  );
}
