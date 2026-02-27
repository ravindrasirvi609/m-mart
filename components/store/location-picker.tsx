"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { ChevronDown, MapPin, Navigation } from "lucide-react";

import { cn } from "@/lib/utils";

type ServiceArea = {
  id: string;
  area_name: string;
  city: string;
  pincode: string | null;
  delivery_eta_minutes: number;
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

/**
 * Location picker dropdown that appears in the header / hero area.
 * Saves selection to cookie (all users) and DB (authenticated users).
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

  const selectArea = useCallback(
    (selectedArea: ServiceArea) => {
      setArea(selectedArea.area_name);
      setOpen(false);
      setSearch("");

      // Save to cookie
      const locationData = JSON.stringify({
        area: selectedArea.area_name,
        city: selectedArea.city,
        pincode: selectedArea.pincode,
      });

      document.cookie = `${LOCATION_COOKIE}=${encodeURIComponent(locationData)};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

      // Persist to DB for authenticated users
      if (userId) {
        startTransition(async () => {
          try {
            await fetch("/api/user-location", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                area: selectedArea.area_name,
                city: selectedArea.city,
                pincode: selectedArea.pincode,
              }),
            });
          } catch {
            // Silently fail — cookie is already set
          }
        });
      }

      // Reload to reflect new location context
      window.location.reload();
    },
    [userId],
  );

  const filtered = serviceAreas.filter((sa) =>
    sa.area_name.toLowerCase().includes(search.toLowerCase()),
  );

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
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
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
                      ~{sa.delivery_eta_minutes} min
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
