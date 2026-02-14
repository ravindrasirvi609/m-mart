"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUserForAction } from "@/lib/auth";
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
    return { ok: false, error: error.message };
  }

  revalidatePath("/profile");
  revalidatePath("/checkout");
  return { ok: true };
}
