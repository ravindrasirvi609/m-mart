"use server";

import { assertUserForAction, checkIsAdmin } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type MarkNotificationsReadResult =
  | { ok: true; updatedCount: number }
  | { ok: false; error: string };

export async function markNotificationsReadAction(
  ids: string[],
): Promise<MarkNotificationsReadResult> {
  try {
    const normalizedIds = ids.filter((id) => typeof id === "string" && id.length > 0);

    if (normalizedIds.length === 0) {
      return { ok: true, updatedCount: 0 };
    }

    const user = await assertUserForAction();
    const isAdmin = await checkIsAdmin(user.email);
    const admin = createAdminSupabaseClient();

    let query = admin
      .from("notifications")
      .update({ is_read: true })
      .in("id", normalizedIds)
      .select("id");

    if (isAdmin) {
      query = query.eq("target_role", "admin");
    } else {
      query = query.eq("target_role", "customer").eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, updatedCount: data?.length ?? 0 };
  } catch (error) {
    if (error instanceof Error) {
      return { ok: false, error: error.message };
    }

    return { ok: false, error: "Failed to update notifications." };
  }
}
