"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { upsertCampaignAction } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import type { CampaignRow } from "@/lib/queries";
import type { GeoValue } from "@/components/admin/zone-map-picker";

const ZoneMapPicker = dynamic(
  () =>
    import("@/components/admin/zone-map-picker").then(
      (mod) => mod.ZoneMapPicker,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-xl border border-admin-border bg-white/5 animate-pulse" />
    ),
  },
);

const CAMPAIGN_TYPES = [
  { value: "festival", label: "Festival" },
  { value: "seasonal", label: "Seasonal" },
  { value: "flash_sale", label: "Flash Sale" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
] as const;

interface CampaignFormProps {
  campaign?: CampaignRow;
  onSuccess?: () => void;
}

export function CampaignForm({ campaign, onSuccess }: CampaignFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(upsertCampaignAction, null);
  const [geoEnabled, setGeoEnabled] = useState(
    !!(campaign?.target_lat && campaign?.target_lng),
  );
  const [geo, setGeo] = useState<GeoValue>({
    latitude: campaign?.target_lat ?? 18.5912,
    longitude: campaign?.target_lng ?? 73.7388,
    radius_km: campaign?.target_radius_km ?? 10,
  });

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
      {campaign && <input type="hidden" name="id" value={campaign.id} />}

      {/* Hidden geo fields */}
      {geoEnabled && (
        <>
          <input type="hidden" name="target_lat" value={geo.latitude} />
          <input type="hidden" name="target_lng" value={geo.longitude} />
          <input type="hidden" name="target_radius_km" value={geo.radius_km} />
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Name *
          </label>
          <Input
            name="name"
            required
            defaultValue={campaign?.name}
            placeholder="Diwali Mega Sale"
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
            defaultValue={campaign?.slug}
            placeholder="diwali-mega-sale"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Type *
          </label>
          <select
            name="campaign_type"
            required
            defaultValue={campaign?.campaign_type ?? "custom"}
            disabled={isPending}
            className="h-10 w-full rounded-xl border border-admin-border bg-white/5 px-3 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
          >
            {CAMPAIGN_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Priority
          </label>
          <Input
            name="priority"
            type="number"
            min={0}
            max={100}
            defaultValue={campaign?.priority ?? 0}
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Hero Title *
        </label>
        <Input
          name="hero_title"
          required
          defaultValue={campaign?.hero_title}
          placeholder="Celebrate Diwali with Amazing Deals!"
          className="!bg-white/5 !text-text-main"
          disabled={isPending}
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Hero Subtitle
        </label>
        <Input
          name="hero_subtitle"
          defaultValue={campaign?.hero_subtitle ?? ""}
          placeholder="Up to 40% off on festive essentials"
          className="!bg-white/5 !text-text-main"
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Hero Image URL
          </label>
          <Input
            name="hero_image_url"
            type="url"
            defaultValue={campaign?.hero_image_url ?? ""}
            placeholder="https://..."
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Background Gradient
          </label>
          <Input
            name="hero_bg_gradient"
            id="hero_bg_gradient"
            defaultValue={campaign?.hero_bg_gradient ?? ""}
            placeholder="from-orange-600 to-red-700"
            className="!bg-white/5 !text-text-main font-mono text-xs"
            disabled={isPending}
          />
          <p className="text-[10px] text-text-subtle">
            Use Tailwind notation (e.g.{" "}
            <code className="rounded bg-white/10 px-1">
              from-green-600 to-yellow-500
            </code>
            ) or CSS (e.g.{" "}
            <code className="rounded bg-white/10 px-1">
              linear-gradient(135deg,#16a34a,#eab308)
            </code>
            )
          </p>
          {/* Quick gradient presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: "🔴 Red", value: "from-red-600 to-rose-500" },
              { label: "🟠 Orange", value: "from-orange-500 to-red-600" },
              { label: "🟡 Gold", value: "from-amber-400 to-orange-500" },
              { label: "🟢 Green", value: "from-green-600 to-emerald-500" },
              { label: "🔵 Blue", value: "from-blue-600 to-indigo-600" },
              { label: "🟣 Purple", value: "from-purple-600 to-fuchsia-500" },
              {
                label: "🌅 Sunset",
                value: "from-orange-500 via-red-400 to-yellow-400",
              },
              {
                label: "🎆 Diwali",
                value: "from-amber-500 via-orange-500 to-red-600",
              },
              {
                label: "🌿 Fresh",
                value: "from-emerald-600 via-teal-400 to-cyan-400",
              },
              {
                label: "🩷 Festival",
                value: "from-pink-500 via-purple-500 to-blue-500",
              },
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                disabled={isPending}
                onClick={() => {
                  const input = document.getElementById(
                    "hero_bg_gradient",
                  ) as HTMLInputElement | null;
                  if (input) input.value = preset.value;
                }}
                className="rounded-full border border-admin-border px-2 py-0.5 text-[10px] font-medium text-text-subtle hover:border-brand-red/30 hover:text-brand-red transition-colors disabled:opacity-40"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Badge Text
          </label>
          <Input
            name="badge_text"
            defaultValue={campaign?.badge_text ?? ""}
            placeholder="🎉 Limited Time"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Discount Label
          </label>
          <Input
            name="discount_label"
            defaultValue={campaign?.discount_label ?? ""}
            placeholder="Up to 40% OFF"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
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
              campaign?.starts_at ? toDateTimeLocal(campaign.starts_at) : ""
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
              campaign?.ends_at ? toDateTimeLocal(campaign.ends_at) : ""
            }
            disabled={isPending}
            className="h-10 w-full rounded-xl border border-admin-border bg-white/5 px-3 text-sm text-text-main focus:border-brand-red/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-admin-border bg-white/[0.02] px-4 py-3">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={campaign?.is_active ?? true}
          disabled={isPending}
          id="campaign-active"
          className="h-4 w-4 rounded border-admin-border accent-brand-red"
        />
        <label
          htmlFor="campaign-active"
          className="text-sm font-medium text-text-main"
        >
          Campaign is active
        </label>
      </div>

      {/* Geo-targeting section */}
      <div className="space-y-2 rounded-xl border border-admin-border bg-white/[0.02] p-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="campaign-geo-toggle"
            checked={geoEnabled}
            onChange={(e) => setGeoEnabled(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-admin-border accent-brand-red"
          />
          <label
            htmlFor="campaign-geo-toggle"
            className="text-sm font-medium text-text-main"
          >
            Enable geo-targeting (show only to users near a location)
          </label>
        </div>

        {geoEnabled && (
          <div className="mt-2">
            <ZoneMapPicker
              defaultLat={campaign?.target_lat ?? 18.5912}
              defaultLng={campaign?.target_lng ?? 73.7388}
              defaultRadiusKm={campaign?.target_radius_km ?? 10}
              onChange={setGeo}
            />
          </div>
        )}
      </div>

      <ActionFeedback
        state={state}
        successFallback="Campaign saved successfully."
        errorFallback="Unable to save campaign."
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : campaign
              ? "Update Campaign"
              : "Create Campaign"}
        </Button>
      </div>
    </form>
  );
}
