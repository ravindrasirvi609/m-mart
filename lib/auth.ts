import { redirect } from "next/navigation";

import { getServerEnv } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function isAdminEmail(email: string | null | undefined) {
  if (!email) {
    return false;
  }

  return email.toLowerCase() === getServerEnv().ADMIN_EMAIL.toLowerCase();
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

  if (!isAdminEmail(user.email)) {
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

  if (!isAdminEmail(user.email)) {
    throw new Error("Only admins can perform this action.");
  }

  return user;
}
