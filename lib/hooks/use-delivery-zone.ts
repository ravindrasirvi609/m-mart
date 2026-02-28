"use client";

import { useCallback, useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DeliveryZone = {
  covered: boolean;
  serviceAreaId: string;
  areaName: string;
  deliveryFee: number;
  minOrderFreeDelivery: number;
  deliveryEtaMinutes: number | null;
  distanceKm: number;
  lat: number;
  lng: number;
};

export type UseDeliveryZoneReturn = {
  /** Resolved delivery zone info (null if not yet resolved or unknown) */
  zone: DeliveryZone | null;
  /** Whether the user is out of all service area coverage */
  outOfCoverage: boolean;
  /** Whether zone resolution is in progress */
  loading: boolean;
  /** Re-fetch delivery zone for new coordinates */
  refresh: (lat: number, lng: number) => void;
};

// ---------------------------------------------------------------------------
// Cache — store resolved zone in sessionStorage to avoid re-fetching
// ---------------------------------------------------------------------------

const ZONE_CACHE_KEY = "mmart_delivery_zone";
const COORDS_CACHE_KEY = "mmart_delivery_coords";

function getCachedZone(): DeliveryZone | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(ZONE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DeliveryZone;
  } catch {
    return null;
  }
}

function setCachedZone(zone: DeliveryZone | null) {
  try {
    if (zone) {
      sessionStorage.setItem(ZONE_CACHE_KEY, JSON.stringify(zone));
    } else {
      sessionStorage.removeItem(ZONE_CACHE_KEY);
    }
  } catch {
    // ignore
  }
}

function getCachedCoords(): { lat: number; lng: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(COORDS_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { lat: number; lng: number };
  } catch {
    return null;
  }
}

function setCachedCoords(lat: number, lng: number) {
  try {
    sessionStorage.setItem(COORDS_CACHE_KEY, JSON.stringify({ lat, lng }));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Read location from cookie (matches server-side cookie shape)
// ---------------------------------------------------------------------------

function getLocationFromCookie(): {
  lat: number;
  lng: number;
} | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("mmart_location="));
    if (!match) return null;
    const parsed = JSON.parse(decodeURIComponent(match.split("=")[1]));
    if (
      typeof parsed.latitude === "number" &&
      typeof parsed.longitude === "number"
    ) {
      return { lat: parsed.latitude, lng: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * `useDeliveryZone` — resolves the user's delivery zone from their
 * coordinates by calling the `/api/reverse-geocode` endpoint.
 *
 * Reads coordinates from:
 *   1. Explicit `refresh(lat, lng)` call
 *   2. Cached sessionStorage coords
 *   3. Location cookie (set by LocationPicker / GeoLocationPrompt)
 *
 * Caches the resolved zone in sessionStorage to avoid re-fetching.
 */
export function useDeliveryZone(): UseDeliveryZoneReturn {
  const [zone, setZone] = useState<DeliveryZone | null>(() => getCachedZone());
  const [outOfCoverage, setOutOfCoverage] = useState(false);
  const [loading, setLoading] = useState(false);

  const resolveZone = useCallback(async (lat: number, lng: number) => {
    // Check if we already fetched the same coords
    const cached = getCachedCoords();
    if (
      cached &&
      Math.abs(cached.lat - lat) < 0.0001 &&
      Math.abs(cached.lng - lng) < 0.0001
    ) {
      const cachedZone = getCachedZone();
      if (cachedZone) {
        setZone(cachedZone);
        setOutOfCoverage(false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`);
      const data = await res.json();

      if (!data.matched) {
        setZone(null);
        setOutOfCoverage(true);
        setCachedZone(null);
        setCachedCoords(lat, lng);
        return;
      }

      const area = data.area as {
        id: string;
        area_name: string;
        delivery_fee: number | null;
        min_order_free_delivery: number | null;
        delivery_eta_minutes: number | null;
        distance_km: number;
      };

      const resolved: DeliveryZone = {
        covered: true,
        serviceAreaId: area.id,
        areaName: area.area_name,
        deliveryFee: area.delivery_fee ?? 30,
        minOrderFreeDelivery: area.min_order_free_delivery ?? 500,
        deliveryEtaMinutes: area.delivery_eta_minutes,
        distanceKm: area.distance_km,
        lat,
        lng,
      };

      setZone(resolved);
      setOutOfCoverage(false);
      setCachedZone(resolved);
      setCachedCoords(lat, lng);
    } catch {
      // Network error — keep current state
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-resolve on mount from cookie if not already cached
  useEffect(() => {
    if (zone) return; // already resolved
    const coords = getLocationFromCookie();
    if (coords) {
      resolveZone(coords.lat, coords.lng);
    }
  }, [zone, resolveZone]);

  const refresh = useCallback(
    (lat: number, lng: number) => {
      resolveZone(lat, lng);
    },
    [resolveZone],
  );

  return { zone, outOfCoverage, loading, refresh };
}
