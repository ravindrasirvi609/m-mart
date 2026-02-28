import { NextResponse } from "next/server";
import { z } from "zod";

import { createServerSupabaseClient } from "@/lib/supabase/server";

const querySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * GET /api/reverse-geocode?lat=18.59&lng=73.73
 *
 * Returns the nearest service area for a coordinate. Used by the client-side
 * location picker to auto-resolve an area name from GPS coordinates.
 *
 * Public (no auth required) — only returns area metadata, never user data.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = querySchema.safeParse({
    lat: searchParams.get("lat"),
    lng: searchParams.get("lng"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid coordinates. Provide lat & lng query parameters." },
      { status: 400 },
    );
  }

  const { lat, lng } = parsed.data;

  try {
    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .rpc("find_nearest_service_area", {
        p_lat: lat,
        p_lng: lng,
        p_max_distance_km: 50,
      })
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          matched: false,
          message: "No service area found near your location.",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      matched: true,
      area: {
        id: data.id,
        area_name: data.area_name,
        city: data.city,
        pincode: data.pincode,
        delivery_eta_minutes: data.delivery_eta_minutes,
        delivery_fee: data.delivery_fee,
        min_order_free_delivery: data.min_order_free_delivery,
        distance_km: data.distance_km,
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to resolve location" },
      { status: 500 },
    );
  }
}
