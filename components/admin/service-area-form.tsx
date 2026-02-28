"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { upsertServiceAreaAction } from "@/actions/campaign-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ActionFeedback } from "@/components/admin/ui/action-feedback";
import type { ServiceAreaRow } from "@/lib/queries";
import type { GeoValue } from "@/components/admin/zone-map-picker";

// Leaflet must be loaded client-side only (no SSR)
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

interface ServiceAreaFormProps {
  serviceArea?: ServiceAreaRow;
  onSuccess?: () => void;
}

export function ServiceAreaForm({
  serviceArea,
  onSuccess,
}: ServiceAreaFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, isPending] = useActionState(
    upsertServiceAreaAction,
    null,
  );

  // Geo state managed by the map picker
  const [geo, setGeo] = useState<GeoValue>({
    latitude: serviceArea?.latitude ?? 18.5912,
    longitude: serviceArea?.longitude ?? 73.7388,
    radius_km: serviceArea?.radius_km ?? 5,
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

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {serviceArea && <input type="hidden" name="id" value={serviceArea.id} />}

      {/* Hidden geo fields synced from map picker */}
      <input type="hidden" name="latitude" value={geo.latitude} />
      <input type="hidden" name="longitude" value={geo.longitude} />
      <input type="hidden" name="radius_km" value={geo.radius_km} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Area Name *
          </label>
          <Input
            name="area_name"
            required
            defaultValue={serviceArea?.area_name}
            placeholder="Hinjewadi Phase 1"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            City *
          </label>
          <Input
            name="city"
            required
            defaultValue={serviceArea?.city ?? "Pune"}
            placeholder="Pune"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      {/* Map picker for centre + radius */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
          Delivery Zone (click map to set centre)
        </label>
        <ZoneMapPicker
          defaultLat={serviceArea?.latitude ?? 18.5912}
          defaultLng={serviceArea?.longitude ?? 73.7388}
          defaultRadiusKm={serviceArea?.radius_km ?? 5}
          onChange={setGeo}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Pincode
          </label>
          <Input
            name="pincode"
            defaultValue={serviceArea?.pincode ?? ""}
            placeholder="411057"
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
            maxLength={10}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Delivery ETA (min) *
          </label>
          <Input
            name="delivery_eta_minutes"
            type="number"
            required
            min={5}
            max={300}
            defaultValue={serviceArea?.delivery_eta_minutes ?? 30}
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
            defaultValue={serviceArea?.sort_order ?? 0}
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Delivery Fee (₹)
          </label>
          <Input
            name="delivery_fee"
            type="number"
            min={0}
            step={0.01}
            defaultValue={serviceArea?.delivery_fee ?? 0}
            className="!bg-white/5 !text-text-main"
            disabled={isPending}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text-subtle">
            Min Order for Free Delivery (₹)
          </label>
          <Input
            name="min_order_free_delivery"
            type="number"
            min={0}
            step={0.01}
            defaultValue={serviceArea?.min_order_free_delivery ?? 500}
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
          defaultChecked={serviceArea?.is_active ?? true}
          disabled={isPending}
          id="area-active"
          className="h-4 w-4 rounded border-admin-border accent-brand-red"
        />
        <label
          htmlFor="area-active"
          className="text-sm font-medium text-text-main"
        >
          Area is active for delivery
        </label>
      </div>

      <ActionFeedback
        state={state}
        successFallback="Service area saved successfully."
        errorFallback="Unable to save service area."
      />

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : serviceArea ? "Update Area" : "Add Area"}
        </Button>
      </div>
    </form>
  );
}
