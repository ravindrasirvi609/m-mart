import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    console.log("[Auth] No email provided for admin check");
    return false;
  }

  const adminEmail = getServerEnv().ADMIN_EMAIL.toLowerCase().trim();
  const userEmail = email.toLowerCase().trim();
  const isAdmin = userEmail === adminEmail;

  console.log(`[Auth] Admin check: ${userEmail} === ${adminEmail} -> ${isAdmin}`);

  return isAdmin;
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
  console.log("[Auth] requireAdmin called");
  const user = await requireUser();

  if (!isAdminEmail(user.email)) {
    console.log(`[Auth] Unauthorized admin access attempt by ${user.email}`);
    redirect("/");
  }

  console.log(`[Auth] Admin access granted to ${user.email}`);
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

  if (!isAdminEmail(user.email)) {
    throw new Error("Only admins can perform this action.");
  }

  return user;
}
