import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const locationSchema = z.object({
  area: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  pincode: z.string().max(10).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

/**
 * POST /api/user-location
 * Persists the authenticated user's delivery location to the database.
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
    const { error } = await supabase.from("user_locations").upsert(
      {
        user_id: user.id,
        area: parsed.area,
        city: parsed.city,
        pincode: parsed.pincode ?? null,
        latitude: parsed.latitude ?? null,
        longitude: parsed.longitude ?? null,
        updated_at: new Date().toISOString(),
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
