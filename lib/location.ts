/**
 * Location Context System
 * ========================
 * Manages user delivery location selection and provides geo-aware content
 * targeting using coordinates + proximity queries via PostGIS RPCs.
 *
 * Architecture:
 *   - Server: reads location from user_locations table or cookie
 *   - Client: LocationPicker component sets cookie + calls API to persist
 *   - Banners & campaigns are geo-targeted via lat/lng + radius
 *   - Service areas have a centre point + radius for delivery coverage
 */

import { cookies } from "next/headers";

import { createServerSupabaseClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UserLocation = {
  area: string;
  city: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  location_source: string | null;
};

export type ServiceArea = {
  id: string;
  area_name: string;
  city: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_km: number | null;
  delivery_eta_minutes: number | null;
  delivery_fee: number | null;
  min_order_free_delivery: number | null;
};

export type NearestServiceArea = ServiceArea & {
  distance_km: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCATION_COOKIE = "mmart_location";
const DEFAULT_LOCATION: UserLocation = {
  area: "Hinjewadi Phase 1",
  city: "Pune",
  pincode: "411057",
  latitude: 18.5912,
  longitude: 73.7388,
  location_source: null,
};

// ---------------------------------------------------------------------------
// Server-side location resolution
// ---------------------------------------------------------------------------

/**
 * Resolves the user's current location with the following priority:
 *   1. Authenticated user → `user_locations` table
 *   2. Cookie → `mmart_location` (JSON-encoded)
 *   3. Fallback → default Hinjewadi Phase 1
 */
export async function getUserLocation(
  userId?: string | null,
): Promise<UserLocation> {
  // 1. Try DB for authenticated users
  if (userId) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase
        .from("user_locations")
        .select("area, city, pincode, latitude, longitude, location_source")
        .eq("user_id", userId)
        .single();

      if (data) {
        return {
          area: data.area,
          city: data.city,
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude,
          location_source: data.location_source,
        };
      }
    } catch {
      // Table may not exist yet — fall through
    }
  }

  // 2. Try cookie
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(LOCATION_COOKIE)?.value;

    if (raw) {
      const parsed = JSON.parse(
        decodeURIComponent(raw),
      ) as Partial<UserLocation>;

      if (parsed.area && parsed.city) {
        return {
          area: parsed.area,
          city: parsed.city,
          pincode: parsed.pincode ?? null,
          latitude: parsed.latitude ?? null,
          longitude: parsed.longitude ?? null,
          location_source: parsed.location_source ?? null,
        };
      }
    }
  } catch {
    // Malformed cookie — fall through
  }

  // 3. Default
  return DEFAULT_LOCATION;
}

/**
 * Fetches all active service areas for the location picker dropdown.
 */
export async function getServiceAreas(): Promise<ServiceArea[]> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("service_areas")
      .select(
        "id, area_name, city, pincode, latitude, longitude, radius_km, delivery_eta_minutes, delivery_fee, min_order_free_delivery",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return data ?? [];
  } catch {
    // Table may not exist yet — return empty
    return [];
  }
}

/**
 * Finds the nearest service area to a given lat/lng using PostGIS RPC.
 * Returns null if no service area is within the max distance.
 */
export async function findNearestServiceArea(
  lat: number,
  lng: number,
  maxDistanceKm = 50,
): Promise<NearestServiceArea | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .rpc("find_nearest_service_area", {
        p_lat: lat,
        p_lng: lng,
        p_max_distance_km: maxDistanceKm,
      })
      .single();

    if (!data) return null;

    return {
      id: data.id,
      area_name: data.area_name,
      city: data.city,
      pincode: data.pincode,
      latitude: null,
      longitude: null,
      radius_km: null,
      delivery_eta_minutes: data.delivery_eta_minutes,
      delivery_fee: data.delivery_fee,
      min_order_free_delivery: data.min_order_free_delivery,
      distance_km: data.distance_km,
    };
  } catch {
    return null;
  }
}

/**
 * Returns the delivery ETA for a given area (in minutes).
 * Falls back to text-based lookup when no coordinates are available.
 */
export async function getDeliveryEta(area: string): Promise<number> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("service_areas")
      .select("delivery_eta_minutes")
      .eq("area_name", area)
      .eq("is_active", true)
      .single();

    return data?.delivery_eta_minutes ?? 45;
  } catch {
    return 45;
  }
}

/**
 * Haversine distance in km (client-side fallback when PostGIS is unavailable).
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export { LOCATION_COOKIE, DEFAULT_LOCATION };
