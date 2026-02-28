import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env";
import { recordSecurityEvent } from "@/lib/security/audit";
import { AuthError } from "@/lib/security/errors";
import { logger } from "@/lib/security/logger";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getSafeNextPath(nextPath: string | undefined, fallback = "/") {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

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
export async function checkIsAdmin(
  email: string | null | undefined,
): Promise<boolean> {
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
    logger.warn("[Auth] Error checking admin_users table:", error.message);
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

export async function requireUser(nextPath = "/") {
  const user = await getCurrentUser();

  if (!user) {
    const safeNextPath = getSafeNextPath(nextPath);
    redirect(`/login?next=${encodeURIComponent(safeNextPath)}`);
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");

  const isAdmin = await checkIsAdmin(user.email);
  if (!isAdmin) {
    await recordSecurityEvent({
      eventType: "admin_access_denied",
      outcome: "blocked",
      riskLevel: "high",
      email: user.email ?? undefined,
      userId: user.id,
    });
    redirect("/");
  }

  return user;
}

export async function assertUserForAction() {
  const user = await getCurrentUser();

  if (!user) {
    throw new AuthError(
      "Your session has expired. Please log in again to continue.",
    );
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
