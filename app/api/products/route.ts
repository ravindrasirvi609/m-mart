import { NextResponse } from "next/server";

import { PAGE_SIZE } from "@/lib/constants";
import { getProductsChunk } from "@/lib/queries";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // --- Batch fetch by IDs (used by RecentlyViewed component) ---
  const idsParam = searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
      .slice(0, 12);

    if (ids.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .in("id", ids)
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json({ products: data ?? [] });
  }

  // --- Standard paginated fetch ---
  const search = String(searchParams.get("search") ?? "").trim();
  const category = String(searchParams.get("category") ?? "all");
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const { products, totalCount, error } = await getProductsChunk({
    search,
    category,
    page,
  });

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products,
    totalCount,
    hasMore: page * PAGE_SIZE < totalCount,
  });
}
