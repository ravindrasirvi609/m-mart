import { NextResponse } from "next/server";

import { PAGE_SIZE } from "@/lib/constants";
import { getProductsChunk } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
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
