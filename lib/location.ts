/**
 * Location Context System
 * ========================
 * Manages user delivery location selection and provides area-aware content
 * targeting. Works with both authenticated users (saved in DB) and guests
 * (saved in cookies/localStorage).
 *
 * Architecture:
 *   - Server: reads location from user_locations table or cookie
 *   - Client: LocationPicker component sets cookie + calls API to persist
 *   - Banners & campaigns can target specific `location_area` values
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
};

export type ServiceArea = {
  id: string;
  area_name: string;
  city: string;
  pincode: string | null;
  delivery_eta_minutes: number;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LOCATION_COOKIE = "mmart_location";
const DEFAULT_LOCATION: UserLocation = {
  area: "Hinjewadi Phase 1",
  city: "Pune",
  pincode: "411057",
  latitude: null,
  longitude: null,
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
        .select("area, city, pincode, latitude, longitude")
        .eq("user_id", userId)
        .single();

      if (data) {
        return {
          area: data.area,
          city: data.city,
          pincode: data.pincode,
          latitude: data.latitude,
          longitude: data.longitude,
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
      .select("id, area_name, city, pincode, delivery_eta_minutes")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    return data ?? [];
  } catch {
    // Table may not exist yet — return empty
    return [];
  }
}

/**
 * Returns the delivery ETA for a given area (in minutes).
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

export { LOCATION_COOKIE, DEFAULT_LOCATION };
