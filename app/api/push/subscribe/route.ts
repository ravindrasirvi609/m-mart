import { NextResponse, type NextRequest } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

/**
 * POST /api/push/subscribe — Save a Web Push subscription for the current user.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 },
      );
    }

    // Use admin client to bypass RLS for upsert
    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const admin = createAdminSupabaseClient();

    // Upsert: if this endpoint already exists, update it
    const { error: upsertError } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: body.endpoint,
          keys_p256dh: body.keys.p256dh,
          keys_auth: body.keys.auth,
          user_agent: request.headers.get("user-agent") ?? undefined,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" },
      );

    if (upsertError) {
      console.error("[PushSubscribe] Upsert failed:", upsertError.message);
      return NextResponse.json(
        { error: "Failed to save subscription" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PushSubscribe] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/push/subscribe — Remove a push subscription.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { endpoint?: string };

    if (!body.endpoint) {
      return NextResponse.json({ error: "Endpoint required" }, { status: 400 });
    }

    const { createAdminSupabaseClient } = await import("@/lib/supabase/admin");
    const admin = createAdminSupabaseClient();

    await admin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint)
      .eq("user_id", user.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[PushUnsubscribe] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
