"use client";

import { useCallback, useEffect, useState } from "react";
import { Locate, MapPin, X } from "lucide-react";

import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResolvedArea = {
  id: string;
  area_name: string;
  city: string;
  pincode: string;
  delivery_eta_minutes: number | null;
  delivery_fee: number | null;
  min_order_free_delivery: number | null;
  distance_km: number;
};

interface GeoLocationPromptProps {
  /** User ID — if set, also persists to DB */
  userId: string | null;
  /** Called after location is resolved so parent can react */
  onLocationResolved?: (
    area: ResolvedArea,
    latitude: number,
    longitude: number,
  ) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Persistence keys
// ---------------------------------------------------------------------------
const PROMPT_DISMISSED_KEY = "mmart_geo_prompt_dismissed";
const LOCATION_COOKIE = "mmart_location";

function wasDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
}

function markDismissed() {
  try {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * A non-blocking banner that appears at the bottom of the viewport on first
 * visit, asking the user to share their GPS location for better delivery
 * estimates and geo-targeted content.
 *
 * Flow:
 *   1. Checks localStorage — if already dismissed, renders nothing.
 *   2. Shows "Enable location for faster delivery" prompt.
 *   3. On accept → acquires GPS → calls /api/reverse-geocode → sets cookie & DB.
 *   4. Auto-dismisses after success or manual dismiss.
 */
export function GeoLocationPrompt({
  userId,
  onLocationResolved,
  className,
}: GeoLocationPromptProps) {
  const [visible, setVisible] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState<ResolvedArea | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { position, status, errorMessage, requestPosition, isSupported } =
    useGeolocation();

  // Show prompt only if not previously dismissed and geo is supported
  useEffect(() => {
    if (!isSupported) return;
    // Don't show if user already granted + has position (auto-resolved)
    if (status === "granted" && position) return;
    // Don't show if explicitly dismissed
    if (wasDismissed()) return;

    // Small delay so the page renders first
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, [isSupported, status, position]);

  // Once position is acquired, reverse-geocode it
  useEffect(() => {
    if (!position || resolved) return;
    // If already dismissed (e.g. after a reload), don't re-process
    if (wasDismissed()) return;

    let cancelled = false;
    setResolving(true);
    setError(null);

    (async () => {
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${position.latitude}&lng=${position.longitude}`,
        );
        const data = await res.json();

        if (cancelled) return;

        if (!data.matched) {
          setError(
            "We don't deliver to your area yet. Please select manually.",
          );
          setResolving(false);
          return;
        }

        const area = data.area as ResolvedArea;
        setResolved(area);
        setResolving(false);

        // Save to cookie with coordinates
        const cookiePayload = JSON.stringify({
          area: area.area_name,
          city: area.city,
          pincode: area.pincode,
          latitude: position.latitude,
          longitude: position.longitude,
          location_source: "gps",
        });

        document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(cookiePayload)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

        // Persist to DB for authenticated users
        if (userId) {
          try {
            await fetch("/api/user-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                area: area.area_name,
                city: area.city,
                pincode: area.pincode,
                latitude: position.latitude,
                longitude: position.longitude,
                location_source: "gps",
                accuracy_metres: position.accuracy,
              }),
            });
          } catch {
            // Non-critical — cookie is set
          }
        }

        onLocationResolved?.(area, position.latitude, position.longitude);

        // Auto-dismiss after showing success for a moment
        setTimeout(() => {
          setVisible(false);
          markDismissed();
          // Reload to reflect geo-targeted content
          window.location.reload();
        }, 2500);
      } catch {
        if (!cancelled) {
          setError("Could not resolve your location. Please try again.");
          setResolving(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [position, resolved, userId, onLocationResolved]);

  const handleAllow = useCallback(() => {
    setError(null);
    requestPosition();
  }, [requestPosition]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    markDismissed();
  }, []);

  // Nothing to render
  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[60] animate-slide-up px-4 pb-4 sm:inset-x-auto sm:bottom-6 sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:px-0",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>

        <div className="p-5">
          {/* Success state */}
          {resolved ? (
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30">
                <MapPin size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Delivering to {resolved.area_name}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {resolved.city}
                  {resolved.pincode ? ` — ${resolved.pincode}` : ""}
                  {resolved.delivery_eta_minutes
                    ? ` · ~${resolved.delivery_eta_minutes} min`
                    : ""}
                  {resolved.distance_km
                    ? ` · ${resolved.distance_km.toFixed(1)} km away`
                    : ""}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Default / requesting / error states */}
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1ed] dark:bg-[#c91510]/15">
                  <Locate
                    size={20}
                    className={cn(
                      "text-[#c91510]",
                      (status === "requesting" || resolving) && "animate-pulse",
                    )}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {status === "requesting" || resolving
                      ? "Detecting your location…"
                      : "Enable location for faster delivery"}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    {status === "requesting" || resolving
                      ? "Please allow access when prompted"
                      : "Share your GPS so we can show delivery times, fees & availability for your area."}
                  </p>

                  {/* Error display */}
                  {(error || (status === "denied" && errorMessage)) && (
                    <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
                      {error ?? errorMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              {status !== "requesting" && !resolving && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAllow}
                    disabled={status === "denied"}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#f65636] to-[#c91510] px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Locate size={13} className="mr-1.5 inline-block" />
                    {status === "denied"
                      ? "Permission Denied"
                      : "Allow Location"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Not now
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
