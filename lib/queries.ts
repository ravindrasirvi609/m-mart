import type { PostgrestError } from "@supabase/supabase-js";
import { z } from "zod";

import { assertAdminForAction } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD, PAGE_SIZE } from "@/lib/constants";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type CategoryLite = Pick<CategoryRow, "id" | "name">;
type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

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
  await assertAdminForAction();
  const supabase = createAdminSupabaseClient();

  const [
    { count: totalOrders },
    { count: pendingPayments },
    { data: paidOrders },
    { data: lowStockProducts },
    { count: totalCustomers },
    { data: recentOrders },
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
    supabase.from("users").select("id", { head: true, count: "exact" }),
    supabase
      .from("orders")
      .select(`
        id,
        created_at,
        total_amount,
        payment_status,
        order_status,
        users (name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (paidOrders ?? []).reduce(
    (acc, order) => acc + Number(order.total_amount ?? 0),
    0,
  );

  return {
    totalOrders: totalOrders ?? 0,
    pendingPayments: pendingPayments ?? 0,
    totalRevenue,
    totalCustomers: totalCustomers ?? 0,
    lowStockProducts: lowStockProducts ?? [],
    recentOrders: (recentOrders ?? []).map(o => ({
      ...o,
      user: Array.isArray(o.users) ? o.users[0] : o.users
    })),
  };
}

export async function getAdminProducts() {
  await assertAdminForAction();
  const supabase = createAdminSupabaseClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("*").order("name", { ascending: true }),
  ]);

  return { products: products ?? [], categories: categories ?? [] };
}

export async function getAdminProductById(productId: string) {
  await assertAdminForAction();
  const parsedProductId = z.string().uuid().safeParse(productId);
  if (!parsedProductId.success) {
    return {
      product: null,
      categories: [],
    };
  }

  const supabase = createAdminSupabaseClient();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", parsedProductId.data).single(),
    supabase.from("categories").select("*").eq("is_active", true).order("name"),
  ]);

  return {
    product,
    categories: categories ?? [],
  };
}

export async function getAdminOrders() {
  await assertAdminForAction();
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

export async function getCurrentUserNotifications({
  userId,
  isAdmin,
  limit = 12,
}: {
  userId: string;
  isAdmin: boolean;
  limit?: number;
}): Promise<{ items: NotificationRow[]; notificationsAvailable: boolean }> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (isAdmin) {
    query = query.eq("target_role", "admin");
  } else {
    query = query.eq("target_role", "customer").eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    const message = error.message.toLowerCase();
    const missingNotificationsTable =
      error.code === "PGRST205" ||
      message.includes("public.notifications") ||
      message.includes("relation \"notifications\" does not exist");

    if (missingNotificationsTable) {
      return {
        items: [],
        notificationsAvailable: false,
      };
    }

    console.error("[Queries] Failed to fetch notifications:", error.message);
    return {
      items: [],
      notificationsAvailable: true,
    };
  }

  return {
    items: data ?? [],
    notificationsAvailable: true,
  };
}

export async function getAdminUsersData() {
  await assertAdminForAction();
  const supabase = createAdminSupabaseClient();
  const [{ data: users }, { data: adminUsers }] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, email, phone, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("admin_users").select("email"),
  ]);

  const adminEmails = new Set(
    (adminUsers ?? []).map((entry) => entry.email.toLowerCase().trim()),
  );

  return (users ?? []).map((user) => ({
    ...user,
    role: adminEmails.has(user.email.toLowerCase().trim())
      ? ("admin" as const)
      : ("customer" as const),
  }));
}

export function assertNoQueryError(error: PostgrestError | null) {
  if (error) {
    throw new Error(error.message);
  }
}

export type Product = ProductRow;
export type Category = CategoryLite;
export type UserRow = Database["public"]["Tables"]["users"]["Row"];
