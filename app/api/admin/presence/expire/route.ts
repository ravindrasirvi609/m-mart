import { NextResponse } from "next/server";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/presence/expire — Expire stale user presence.
 *
 * This should be called periodically (e.g., every 2 minutes via Vercel Cron).
 * It marks users as offline if they haven't sent a heartbeat in 120 seconds.
 *
 * For Vercel Cron, add to vercel.json:
 * `{ "crons": [{ "path": "/api/admin/presence/expire", "schedule": "every 2 min" }] }`
 */
export async function POST() {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("presence_expire_stale", {
      p_ttl_seconds: 120,
    });

    if (error) {
      console.error("[Presence] Expire failed:", error.message);
      return NextResponse.json(
        { error: "Failed to expire stale presence" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, expired: data ?? 0 });
  } catch (err) {
    console.error("[Presence] Expire error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Allow GET for Vercel Cron (it sends GET requests)
export async function GET() {
  return POST();
}
