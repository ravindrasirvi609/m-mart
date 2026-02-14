import type { PostgrestError } from "@supabase/supabase-js";

import { LOW_STOCK_THRESHOLD, PAGE_SIZE } from "@/lib/constants";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type CategoryLite = Pick<CategoryRow, "id" | "name">;

export async function getHomeData() {
  const supabase = await createServerSupabaseClient();

  const [{ data: categories }, { data: featured }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    categories: categories ?? [],
    featured: featured ?? [],
  };
}

export async function getProductsPageData({
  search,
  category,
  page,
}: {
  search: string;
  category: string;
  page: number;
}) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data: products, count, error }, { data: categories }] =
    await Promise.all([
      query.range(from, to),
      supabase
        .from("categories")
        .select("id,name")
        .eq("is_active", true)
        .order("name", { ascending: true }),
    ]);

  return {
    products: products ?? [],
    categories: categories ?? [],
    totalCount: count ?? 0,
    error,
  };
}

export async function getProductById(id: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  return data;
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from("users").select("*").eq("id", userId).single();
  return data;
}

export async function getUserOrders(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      total_amount,
      delivery_charge,
      payment_status,
      order_status,
      payment_screenshot_url,
      delivery_address,
      order_items (
        id,
        quantity,
        price,
        products (
          id,
          name,
          image_url
        )
      )
      `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function getAdminDashboardData() {
  const supabase = createAdminSupabaseClient();

  const [
    { count: totalOrders },
    { count: pendingPayments },
    { data: paidOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("orders").select("id", { head: true, count: "exact" }),
    supabase
      .from("orders")
      .select("id", { head: true, count: "exact" })
      .eq("payment_status", "pending_verification"),
    supabase.from("orders").select("total_amount").eq("payment_status", "paid"),
    supabase
      .from("products")
      .select("id,name,stock")
      .lte("stock", LOW_STOCK_THRESHOLD)
      .order("stock", { ascending: true }),
  ]);

  const totalRevenue = (paidOrders ?? []).reduce(
    (acc, order) => acc + Number(order.total_amount ?? 0),
    0,
  );

  return {
    totalOrders: totalOrders ?? 0,
    pendingPayments: pendingPayments ?? 0,
    totalRevenue,
    lowStockProducts: lowStockProducts ?? [],
  };
}

export async function getAdminProducts() {
  const supabase = createAdminSupabaseClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return { products: products ?? [], categories: categories ?? [] };
}

export async function getAdminProductById(productId: string) {
  const supabase = createAdminSupabaseClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).single(),
    supabase.from("categories").select("*").eq("is_active", true).order("name"),
  ]);

  return {
    product,
    categories: categories ?? [],
  };
}

export async function getAdminOrders() {
  const supabase = createAdminSupabaseClient();
  const { data } = await supabase
    .from("orders")
    .select(
      `
      id,
      created_at,
      total_amount,
      delivery_charge,
      payment_status,
      order_status,
      payment_screenshot_url,
      delivery_address,
      users (
        id,
        name,
        email,
        phone
      ),
      order_items (
        id,
        quantity,
        price,
        products (
          id,
          name,
          image_url
        )
      )
      `,
    )
    .order("created_at", { ascending: false });

  return data ?? [];
}

export function assertNoQueryError(error: PostgrestError | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export type Product = ProductRow;
export type Category = CategoryLite;
