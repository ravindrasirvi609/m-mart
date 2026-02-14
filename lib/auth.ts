import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  const adminEmail = getServerEnv().ADMIN_EMAIL.toLowerCase().trim();
  const userEmail = email.toLowerCase().trim();
  const isAdmin = userEmail === adminEmail;

  return isAdmin;
}

/**
 * Checks if an email belongs to an admin, either via environment variable
 * or by checking the `admin_users` table in the database.
 */
export async function checkIsAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false;

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check environment variable (fast path)
  if (isAdminEmail(normalizedEmail)) return true;

  // 2. Check the admin_users table in the database
  const adminClient = createAdminSupabaseClient();
  const { data, error } = await adminClient
    .from("admin_users")
    .select("email")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error) {
    console.error("[Auth] Error checking admin_users table:", error.message);
    return false;
  }

  return !!data;
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  const isAdmin = await checkIsAdmin(user.email);
  if (!isAdmin) {
    console.warn(`[Auth] Unauthorized admin access attempt by ${user.email}`);
    redirect("/");
  }

  return user;
}

export async function assertUserForAction() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You must be logged in to perform this action.");
  }

  return user;
}

export async function assertAdminForAction() {
  const user = await assertUserForAction();

  const isAdmin = await checkIsAdmin(user.email);
  if (!isAdmin) {
    throw new Error("Only admins can perform this action.");
  }

  return user;
}
