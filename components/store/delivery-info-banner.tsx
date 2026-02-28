"use client";

import { Clock3, MapPin, Truck, Wallet } from "lucide-react";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeliveryInfoBannerProps {
  /** Resolved area name */
  area: string;
  /** Delivery ETA in minutes */
  deliveryEta: number | null;
  /** Distance from user to nearest service area centre (km) */
  distanceKm: number | null;
  /** Delivery fee in ₹ */
  deliveryFee: number | null;
  /** Minimum order amount for free delivery */
  minOrderFreeDelivery: number | null;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Compact delivery-info strip that shows ETA, distance, and fee for the
 * user's current (geo-resolved or manually picked) delivery area.
 *
 * Designed to sit below the location picker on the homepage.
 */
export function DeliveryInfoBanner({
  area,
  deliveryEta,
  distanceKm,
  deliveryFee,
  minOrderFreeDelivery,
  className,
}: DeliveryInfoBannerProps) {
  const hasFreeDelivery = deliveryFee != null && deliveryFee === 0;
  const hasFreeDeliveryThreshold =
    !hasFreeDelivery &&
    minOrderFreeDelivery != null &&
    minOrderFreeDelivery > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 px-5 py-3 dark:border-emerald-900/30 dark:bg-emerald-950/20",
        className,
      )}
    >
      {/* Area */}
      <div className="flex items-center gap-1.5">
        <MapPin size={13} className="text-emerald-600 dark:text-emerald-400" />
        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
          {area}
        </span>
      </div>

      {/* ETA */}
      {deliveryEta != null && (
        <>
          <Dot />
          <div className="flex items-center gap-1.5">
            <Clock3
              size={13}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              ~{deliveryEta} min
            </span>
          </div>
        </>
      )}

      {/* Distance */}
      {distanceKm != null && (
        <>
          <Dot />
          <div className="flex items-center gap-1.5">
            <Truck
              size={13}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {distanceKm.toFixed(1)} km
            </span>
          </div>
        </>
      )}

      {/* Delivery fee */}
      {deliveryFee != null && (
        <>
          <Dot />
          <div className="flex items-center gap-1.5">
            <Wallet
              size={13}
              className="text-emerald-600 dark:text-emerald-400"
            />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {hasFreeDelivery ? (
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Free Delivery
                </span>
              ) : (
                `₹${deliveryFee} delivery`
              )}
            </span>
          </div>
        </>
      )}

      {/* Free delivery threshold hint */}
      {hasFreeDeliveryThreshold && (
        <>
          <Dot />
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Free above ₹{minOrderFreeDelivery}
          </span>
        </>
      )}
    </div>
  );
}

/** Tiny separator dot */
function Dot() {
  return <span className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />;
}
