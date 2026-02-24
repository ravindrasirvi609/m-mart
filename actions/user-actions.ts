"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUserForAction } from "@/lib/auth";
import { toPublicErrorMessage } from "@/lib/security/errors";
import { assertTrustedRequestOrigin } from "@/lib/security/request";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(15)
    .regex(/^[0-9+\-\s]+$/),
  address: z.string().trim().min(10).max(400),
});

export async function upsertProfileAction(formData: FormData) {
  try {
    await assertTrustedRequestOrigin();
    const user = await assertUserForAction();
    const supabase = await createServerSupabaseClient();

    const parsed = profileSchema.safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Please provide valid profile details." };
    }

    const { error } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email ?? "",
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address,
    });

    if (error) {
      return { ok: false, error: "Unable to save profile right now." };
    }

    revalidatePath("/profile");
    revalidatePath("/checkout");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: toPublicErrorMessage(error, "Unable to save profile.") };
  }
}
