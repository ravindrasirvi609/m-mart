import { NextResponse } from "next/server";

import { assertAdminForAction } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    await assertAdminForAction();

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get("campaign_id");
    const collectionId = searchParams.get("collection_id");

    if (!campaignId && !collectionId) {
      return NextResponse.json(
        { error: "campaign_id or collection_id is required" },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabaseClient();

    if (campaignId) {
      const { data, error } = await supabase
        .from("campaign_products")
        .select("product_id, sort_order")
        .eq("campaign_id", campaignId)
        .order("sort_order", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ items: data ?? [] });
    }

    if (collectionId) {
      const { data, error } = await supabase
        .from("collection_products")
        .select("product_id, sort_order")
        .eq("collection_id", collectionId)
        .order("sort_order", { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ items: data ?? [] });
    }

    return NextResponse.json({ items: [] });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
