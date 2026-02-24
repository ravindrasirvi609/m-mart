"use server";

import { z } from "zod";

import { assertUserForAction, checkIsAdmin } from "@/lib/auth";
import { toPublicErrorMessage } from "@/lib/security/errors";
import { assertTrustedRequestOrigin } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type MarkNotificationsReadResult =
  | { ok: true; updatedCount: number }
  | { ok: false; error: string };

export async function markNotificationsReadAction(
  ids: string[],
): Promise<MarkNotificationsReadResult> {
  try {
    await assertTrustedRequestOrigin();
    const idsPayload = z.array(z.string().uuid()).max(100).safeParse(ids);
    if (!idsPayload.success) {
      return { ok: false, error: "Invalid notification payload." };
    }

    const normalizedIds = [...new Set(idsPayload.data)];

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
      return { ok: false, error: "Unable to update notifications right now." };
    }

    return { ok: true, updatedCount: data?.length ?? 0 };
  } catch (error) {
    return { ok: false, error: toPublicErrorMessage(error, "Failed to update notifications.") };
  }
}
