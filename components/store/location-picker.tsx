"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronDown, Locate, Loader2, MapPin, Navigation } from "lucide-react";

import { useGeolocation } from "@/lib/hooks/use-geolocation";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceArea = {
  id: string;
  area_name: string;
  city: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  delivery_eta_minutes: number | null;
};

type ResolvedGeoArea = {
  area_name: string;
  city: string;
  pincode: string;
  delivery_eta_minutes: number | null;
  distance_km: number;
};

type LocationPickerProps = {
  /** Currently selected area */
  currentArea: string;
  /** Currently selected city */
  currentCity: string;
  /** Available service areas */
  serviceAreas: ServiceArea[];
  /** User ID for persisting to DB (null for guests) */
  userId: string | null;
  className?: string;
};

const LOCATION_COOKIE = "mmart_location";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Location picker dropdown with GPS detection.
 *
 * Features:
 *   - "Use my location" button that triggers browser geolocation
 *   - Reverse-geocodes GPS position to nearest service area
 *   - Manual area search fallback
 *   - Saves to cookie (with lat/lng) + DB for authenticated users
 */
export function LocationPicker({
  currentArea,
  currentCity,
  serviceAreas,
  userId,
  className,
}: LocationPickerProps) {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState(currentArea);
  const [search, setSearch] = useState("");
  const [, startTransition] = useTransition();
  const [geoResolving, setGeoResolving] = useState(false);

  const { position, status, requestPosition, isSupported } = useGeolocation();

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-location-picker]")) {
        setOpen(false);
      }
    };

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open]);

  // Handle GPS position once acquired
  useEffect(() => {
    if (!position || !geoResolving) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/reverse-geocode?lat=${position.latitude}&lng=${position.longitude}`,
        );
        const data = await res.json();

        if (cancelled) return;

        if (!data.matched) {
          setGeoResolving(false);
          return;
        }

        const resolved = data.area as ResolvedGeoArea;
        persistLocation(
          {
            area: resolved.area_name,
            city: resolved.city,
            pincode: resolved.pincode,
            latitude: position.latitude,
            longitude: position.longitude,
            location_source: "gps",
            accuracy_metres: position.accuracy,
          },
          resolved.area_name,
        );
      } catch {
        if (!cancelled) {
          setGeoResolving(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, geoResolving]);

  /**
   * Persists location to cookie + optionally DB, then reloads.
   */
  const persistLocation = useCallback(
    (
      payload: {
        area: string;
        city: string;
        pincode: string | null;
        latitude?: number | null;
        longitude?: number | null;
        location_source?: string;
        accuracy_metres?: number;
      },
      displayArea: string,
    ) => {
      setArea(displayArea);
      setOpen(false);
      setSearch("");
      setGeoResolving(false);

      // Cookie (with coordinates if available)
      const cookiePayload = JSON.stringify({
        area: payload.area,
        city: payload.city,
        pincode: payload.pincode,
        ...(payload.latitude != null && { latitude: payload.latitude }),
        ...(payload.longitude != null && { longitude: payload.longitude }),
        ...(payload.location_source && {
          location_source: payload.location_source,
        }),
      });

      document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(cookiePayload)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

      // DB persist for authenticated users
      if (userId) {
        startTransition(async () => {
          try {
            await fetch("/api/user-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          } catch {
            // Non-critical — cookie is already set
          }
        });
      }

      // Reload to reflect new location context
      window.location.reload();
    },
    [userId],
  );

  /**
   * Manual select from dropdown
   */
  const selectArea = useCallback(
    (selectedArea: ServiceArea) => {
      persistLocation(
        {
          area: selectedArea.area_name,
          city: selectedArea.city,
          pincode: selectedArea.pincode,
          latitude: selectedArea.latitude,
          longitude: selectedArea.longitude,
          location_source: "manual",
        },
        selectedArea.area_name,
      );
    },
    [persistLocation],
  );

  /**
   * GPS detect button handler
   */
  const handleUseMyLocation = useCallback(() => {
    setGeoResolving(true);
    requestPosition();
  }, [requestPosition]);

  const filtered = serviceAreas.filter((sa) =>
    sa.area_name.toLowerCase().includes(search.toLowerCase()),
  );

  const isDetecting = geoResolving || status === "requesting";

  return (
    <div className={cn("relative", className)} data-location-picker>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:border-[#c91510]/30 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPin size={13} className="text-[#c91510]" />
        <span className="max-w-[120px] truncate">{area}</span>
        <ChevronDown
          size={12}
          className={cn(
            "text-zinc-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          {/* GPS detect button */}
          {isSupported && (
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isDetecting}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-[#c91510]/15 bg-[#fff6f1] px-3 py-2.5 text-left text-sm font-semibold text-[#c91510] transition hover:bg-[#ffede5] disabled:cursor-wait disabled:opacity-60 dark:border-[#c91510]/25 dark:bg-[#c91510]/10 dark:hover:bg-[#c91510]/15"
            >
              {isDetecting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Locate size={15} />
              )}
              <span>
                {isDetecting ? "Detecting location…" : "Use my location"}
              </span>
            </button>
          )}

          {/* Separator */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              or pick manually
            </span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          </div>

          {/* Search input */}
          <div className="relative mb-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your area..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-[#c91510]/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              autoFocus
            />
            <Navigation
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
          </div>

          {/* Area list */}
          <ul
            className="max-h-56 overflow-y-auto"
            role="listbox"
            aria-label="Select delivery area"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-zinc-400">
                No matching areas found
              </li>
            )}

            {filtered.map((sa) => {
              const isSelected = sa.area_name === area;

              return (
                <li key={sa.id} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => selectArea(sa)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800",
                      isSelected &&
                        "bg-red-50 font-semibold text-[#c91510] dark:bg-red-900/15",
                    )}
                  >
                    <div>
                      <p className="font-medium">{sa.area_name}</p>
                      <p className="text-[11px] text-zinc-400">
                        {sa.city}
                        {sa.pincode ? ` — ${sa.pincode}` : ""}
                      </p>
                    </div>

                    <span className="whitespace-nowrap rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      ~{sa.delivery_eta_minutes ?? 30} min
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
