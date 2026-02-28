import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  area: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  pincode: z.string().max(10).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  location_source: z
    .enum(["gps", "ip", "manual", "address"])
    .optional()
    .default("manual"),
  accuracy_metres: z.number().min(0).nullable().optional(),
});

/**
 * POST /api/user-location
 * Persists the authenticated user's delivery location to the database.
 * Accepts optional GPS coordinates that power geo-based targeting.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = locationSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const now = new Date().toISOString();

    const { error } = await supabase.from("user_locations").upsert(
      {
        user_id: user.id,
        area: parsed.area,
        city: parsed.city,
        pincode: parsed.pincode ?? null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        location_source: parsed.location_source,
        accuracy_metres: parsed.accuracy_metres ?? null,
        // Also store as last-seen coordinates
        last_latitude: parsed.latitude ?? null,
        last_longitude: parsed.longitude ?? null,
        last_location_updated_at: parsed.latitude ? now : null,
        updated_at: now,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      console.error("[UserLocation] Failed to save:", error.message);
      return NextResponse.json(
        { message: "Failed to save location" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid location data" },
        { status: 400 },
      );
    }
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
