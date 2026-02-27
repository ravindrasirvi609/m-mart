"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminForAction } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { toPublicErrorMessage } from "@/lib/security/errors";
import { assertTrustedRequestOrigin } from "@/lib/security/request";

/* ─────────────────────── Schemas ─────────────────────── */

const campaignTypeOptions = [
  "festival",
  "seasonal",
  "flash_sale",
  "weekly",
  "custom",
] as const;

const campaignSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  campaign_type: z.enum(campaignTypeOptions),
  hero_title: z.string().trim().min(2).max(200),
  hero_subtitle: z.string().trim().max(300).optional(),
  hero_image_url: z.string().trim().url().or(z.literal("")).optional(),
  hero_bg_gradient: z.string().trim().max(300).optional(),
  badge_text: z.string().trim().max(60).optional(),
  discount_label: z.string().trim().max(60).optional(),
  starts_at: z.string().min(1, "Start date is required"),
  ends_at: z.string().min(1, "End date is required"),
  is_active: z.boolean(),
  priority: z.coerce.number().int().min(0).max(100),
});

const bannerSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(200).optional(),
  image_url: z.string().trim().url(),
  link_url: z.string().trim().url().or(z.literal("")).optional(),
  bg_color: z.string().trim().max(60).optional(),
  location_area: z.string().trim().max(120).optional(),
  starts_at: z.string().min(1),
  ends_at: z.string().min(1),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
});

const collectionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  icon_name: z.string().trim().max(60).optional(),
  bg_color: z.string().trim().max(60).optional(),
  is_active: z.boolean(),
  sort_order: z.coerce.number().int().min(0),
});

const serviceAreaSchema = z.object({
  id: z.string().uuid().optional(),
  area_name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  pincode: z.string().trim().max(10).optional(),
  is_active: z.boolean(),
  delivery_eta_minutes: z.coerce.number().int().min(5).max(300),
  sort_order: z.coerce.number().int().min(0),
});

const productTagSchema = z.object({
  product_id: z.string().uuid(),
  tag: z.string().trim().min(2).max(60),
});

/* ─────────────────────── Helpers ─────────────────────── */

function parseFormBoolean(value: FormDataEntryValue | null): boolean {
  return value === "true" || value === "on";
}

function parseOptionalString(
  value: FormDataEntryValue | null,
): string | undefined {
  const str = typeof value === "string" ? value.trim() : "";
  return str.length > 0 ? str : undefined;
}

/* ─────────────────── Campaign Actions ────────────────── */

export async function upsertCampaignAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = campaignSchema.safeParse({
      id: parseOptionalString(formData.get("id")),
      name: formData.get("name"),
      slug: formData.get("slug"),
      campaign_type: formData.get("campaign_type"),
      hero_title: formData.get("hero_title"),
      hero_subtitle: parseOptionalString(formData.get("hero_subtitle")),
      hero_image_url: parseOptionalString(formData.get("hero_image_url")),
      hero_bg_gradient: parseOptionalString(formData.get("hero_bg_gradient")),
      badge_text: parseOptionalString(formData.get("badge_text")),
      discount_label: parseOptionalString(formData.get("discount_label")),
      starts_at: formData.get("starts_at"),
      ends_at: formData.get("ends_at"),
      is_active: parseFormBoolean(formData.get("is_active")),
      priority: formData.get("priority") || "0",
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid form data.";
      return { ok: false, error: firstError };
    }

    const admin = createAdminSupabaseClient();
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      campaign_type: parsed.data.campaign_type,
      hero_title: parsed.data.hero_title,
      hero_subtitle: parsed.data.hero_subtitle ?? null,
      hero_image_url: parsed.data.hero_image_url ?? null,
      hero_bg_gradient: parsed.data.hero_bg_gradient ?? null,
      badge_text: parsed.data.badge_text ?? null,
      discount_label: parsed.data.discount_label ?? null,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      is_active: parsed.data.is_active,
      priority: parsed.data.priority,
    };

    if (parsed.data.id) {
      const { error } = await admin
        .from("campaigns")
        .update(payload)
        .eq("id", parsed.data.id);
      if (error)
        return { ok: false, error: "Unable to update campaign right now." };
    } else {
      const { error } = await admin.from("campaigns").insert(payload);
      if (error)
        return { ok: false, error: "Unable to create campaign right now." };
    }

    revalidatePath("/admin/campaigns");
    revalidatePath("/");

    return {
      ok: true,
      message: parsed.data.id
        ? "Campaign updated successfully."
        : "Campaign created successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to save campaign."),
    };
  }
}

export async function deleteCampaignAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const id = z.string().uuid().safeParse(formData.get("id"));
    if (!id.success) return { ok: false, error: "Invalid campaign ID." };

    const admin = createAdminSupabaseClient();

    // Delete related products first
    await admin.from("campaign_products").delete().eq("campaign_id", id.data);

    const { error } = await admin.from("campaigns").delete().eq("id", id.data);

    if (error)
      return { ok: false, error: "Unable to delete campaign right now." };

    revalidatePath("/admin/campaigns");
    revalidatePath("/");
    return { ok: true, message: "Campaign deleted successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to delete campaign."),
    };
  }
}

export async function updateCampaignProductsAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const campaignId = z.string().uuid().safeParse(formData.get("campaign_id"));
    if (!campaignId.success)
      return { ok: false, error: "Invalid campaign ID." };

    const productIdsRaw = formData.get("product_ids");
    let productIds: string[] = [];
    if (typeof productIdsRaw === "string" && productIdsRaw.trim()) {
      try {
        productIds = JSON.parse(productIdsRaw);
      } catch {
        productIds = productIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const admin = createAdminSupabaseClient();

    // Replace all campaign products
    await admin
      .from("campaign_products")
      .delete()
      .eq("campaign_id", campaignId.data);

    if (productIds.length > 0) {
      const rows = productIds.map((pid, idx) => ({
        campaign_id: campaignId.data,
        product_id: pid,
        sort_order: idx,
      }));
      const { error } = await admin.from("campaign_products").insert(rows);
      if (error)
        return {
          ok: false,
          error: "Unable to update campaign products right now.",
        };
    }

    revalidatePath("/admin/campaigns");
    revalidatePath("/");
    return {
      ok: true,
      message: `${productIds.length} product(s) assigned to campaign.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to update campaign products."),
    };
  }
}

/* ─────────────────── Banner Actions ──────────────────── */

export async function upsertBannerAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = bannerSchema.safeParse({
      id: parseOptionalString(formData.get("id")),
      title: formData.get("title"),
      subtitle: parseOptionalString(formData.get("subtitle")),
      image_url: formData.get("image_url"),
      link_url: parseOptionalString(formData.get("link_url")),
      bg_color: parseOptionalString(formData.get("bg_color")),
      location_area: parseOptionalString(formData.get("location_area")),
      starts_at: formData.get("starts_at"),
      ends_at: formData.get("ends_at"),
      is_active: parseFormBoolean(formData.get("is_active")),
      sort_order: formData.get("sort_order") || "0",
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid form data.";
      return { ok: false, error: firstError };
    }

    const admin = createAdminSupabaseClient();
    const payload = {
      title: parsed.data.title,
      subtitle: parsed.data.subtitle ?? null,
      image_url: parsed.data.image_url,
      link_url: parsed.data.link_url ?? null,
      bg_color: parsed.data.bg_color ?? null,
      location_area: parsed.data.location_area ?? null,
      starts_at: parsed.data.starts_at,
      ends_at: parsed.data.ends_at,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
    };

    if (parsed.data.id) {
      const { error } = await admin
        .from("banners")
        .update(payload)
        .eq("id", parsed.data.id);
      if (error)
        return { ok: false, error: "Unable to update banner right now." };
    } else {
      const { error } = await admin.from("banners").insert(payload);
      if (error)
        return { ok: false, error: "Unable to create banner right now." };
    }

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return {
      ok: true,
      message: parsed.data.id
        ? "Banner updated successfully."
        : "Banner created successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to save banner."),
    };
  }
}

export async function deleteBannerAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const id = z.string().uuid().safeParse(formData.get("id"));
    if (!id.success) return { ok: false, error: "Invalid banner ID." };

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("banners").delete().eq("id", id.data);
    if (error)
      return { ok: false, error: "Unable to delete banner right now." };

    revalidatePath("/admin/banners");
    revalidatePath("/");
    return { ok: true, message: "Banner deleted successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to delete banner."),
    };
  }
}

/* ─────────────────── Collection Actions ──────────────── */

export async function upsertCollectionAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = collectionSchema.safeParse({
      id: parseOptionalString(formData.get("id")),
      name: formData.get("name"),
      slug: formData.get("slug"),
      description: parseOptionalString(formData.get("description")),
      icon_name: parseOptionalString(formData.get("icon_name")),
      bg_color: parseOptionalString(formData.get("bg_color")),
      is_active: parseFormBoolean(formData.get("is_active")),
      sort_order: formData.get("sort_order") || "0",
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid form data.";
      return { ok: false, error: firstError };
    }

    const admin = createAdminSupabaseClient();
    const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      icon_name: parsed.data.icon_name ?? null,
      bg_color: parsed.data.bg_color ?? null,
      is_active: parsed.data.is_active,
      sort_order: parsed.data.sort_order,
    };

    if (parsed.data.id) {
      const { error } = await admin
        .from("collections")
        .update(payload)
        .eq("id", parsed.data.id);
      if (error)
        return { ok: false, error: "Unable to update collection right now." };
    } else {
      const { error } = await admin.from("collections").insert(payload);
      if (error)
        return { ok: false, error: "Unable to create collection right now." };
    }

    revalidatePath("/admin/collections");
    revalidatePath("/");
    return {
      ok: true,
      message: parsed.data.id
        ? "Collection updated successfully."
        : "Collection created successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to save collection."),
    };
  }
}

export async function deleteCollectionAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const id = z.string().uuid().safeParse(formData.get("id"));
    if (!id.success) return { ok: false, error: "Invalid collection ID." };

    const admin = createAdminSupabaseClient();

    await admin
      .from("collection_products")
      .delete()
      .eq("collection_id", id.data);

    const { error } = await admin
      .from("collections")
      .delete()
      .eq("id", id.data);
    if (error)
      return { ok: false, error: "Unable to delete collection right now." };

    revalidatePath("/admin/collections");
    revalidatePath("/");
    return { ok: true, message: "Collection deleted successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to delete collection."),
    };
  }
}

export async function updateCollectionProductsAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const collectionId = z
      .string()
      .uuid()
      .safeParse(formData.get("collection_id"));
    if (!collectionId.success)
      return { ok: false, error: "Invalid collection ID." };

    const productIdsRaw = formData.get("product_ids");
    let productIds: string[] = [];
    if (typeof productIdsRaw === "string" && productIdsRaw.trim()) {
      try {
        productIds = JSON.parse(productIdsRaw);
      } catch {
        productIds = productIdsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }

    const admin = createAdminSupabaseClient();

    await admin
      .from("collection_products")
      .delete()
      .eq("collection_id", collectionId.data);

    if (productIds.length > 0) {
      const rows = productIds.map((pid, idx) => ({
        collection_id: collectionId.data,
        product_id: pid,
        sort_order: idx,
      }));
      const { error } = await admin.from("collection_products").insert(rows);
      if (error)
        return {
          ok: false,
          error: "Unable to update collection products right now.",
        };
    }

    revalidatePath("/admin/collections");
    revalidatePath("/");
    return {
      ok: true,
      message: `${productIds.length} product(s) assigned to collection.`,
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(
        error,
        "Failed to update collection products.",
      ),
    };
  }
}

/* ──────────────── Product Tag Actions ─────────────────── */

export async function addProductTagAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = productTagSchema.safeParse({
      product_id: formData.get("product_id"),
      tag: formData.get("tag"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Invalid tag data." };
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("product_tags").insert({
      product_id: parsed.data.product_id,
      tag: parsed.data.tag,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "This tag already exists on this product." };
      }
      return { ok: false, error: "Unable to add tag right now." };
    }

    revalidatePath("/admin/product-tags");
    revalidatePath("/");
    return { ok: true, message: "Tag added successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to add tag."),
    };
  }
}

export async function deleteProductTagAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const id = z.string().uuid().safeParse(formData.get("id"));
    if (!id.success) return { ok: false, error: "Invalid tag ID." };

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("product_tags")
      .delete()
      .eq("id", id.data);

    if (error) return { ok: false, error: "Unable to delete tag right now." };

    revalidatePath("/admin/product-tags");
    revalidatePath("/");
    return { ok: true, message: "Tag removed successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to remove tag."),
    };
  }
}

export async function bulkAddProductTagsAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const productId = z.string().uuid().safeParse(formData.get("product_id"));
    if (!productId.success) return { ok: false, error: "Invalid product ID." };

    const tagsRaw = formData.get("tags");
    if (typeof tagsRaw !== "string" || !tagsRaw.trim()) {
      return { ok: false, error: "No tags provided." };
    }

    const tags = tagsRaw
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length >= 2);

    if (tags.length === 0) {
      return { ok: false, error: "No valid tags provided." };
    }

    const admin = createAdminSupabaseClient();

    // Upsert: ignore duplicates
    const rows = tags.map((tag) => ({
      product_id: productId.data,
      tag,
    }));

    const { error } = await admin
      .from("product_tags")
      .upsert(rows, { onConflict: "product_id,tag", ignoreDuplicates: true });

    if (error) {
      return { ok: false, error: "Unable to add tags right now." };
    }

    revalidatePath("/admin/product-tags");
    revalidatePath("/");
    return { ok: true, message: `${tags.length} tag(s) added successfully.` };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to add tags."),
    };
  }
}

/* ──────────────── Service Area Actions ────────────────── */

export async function upsertServiceAreaAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = serviceAreaSchema.safeParse({
      id: parseOptionalString(formData.get("id")),
      area_name: formData.get("area_name"),
      city: formData.get("city") || "Pune",
      pincode: parseOptionalString(formData.get("pincode")),
      is_active: parseFormBoolean(formData.get("is_active")),
      delivery_eta_minutes: formData.get("delivery_eta_minutes") || "30",
      sort_order: formData.get("sort_order") || "0",
    });

    if (!parsed.success) {
      const firstError =
        parsed.error.issues[0]?.message ?? "Invalid form data.";
      return { ok: false, error: firstError };
    }

    const admin = createAdminSupabaseClient();
    const payload = {
      area_name: parsed.data.area_name,
      city: parsed.data.city,
      pincode: parsed.data.pincode ?? null,
      is_active: parsed.data.is_active,
      delivery_eta_minutes: parsed.data.delivery_eta_minutes,
      sort_order: parsed.data.sort_order,
    };

    if (parsed.data.id) {
      const { error } = await admin
        .from("service_areas")
        .update(payload)
        .eq("id", parsed.data.id);
      if (error)
        return { ok: false, error: "Unable to update service area right now." };
    } else {
      const { error } = await admin.from("service_areas").insert(payload);
      if (error)
        return { ok: false, error: "Unable to create service area right now." };
    }

    revalidatePath("/admin/service-areas");
    revalidatePath("/");
    return {
      ok: true,
      message: parsed.data.id
        ? "Service area updated successfully."
        : "Service area created successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to save service area."),
    };
  }
}

export async function deleteServiceAreaAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const id = z.string().uuid().safeParse(formData.get("id"));
    if (!id.success) return { ok: false, error: "Invalid service area ID." };

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("service_areas")
      .delete()
      .eq("id", id.data);

    if (error)
      return { ok: false, error: "Unable to delete service area right now." };

    revalidatePath("/admin/service-areas");
    revalidatePath("/");
    return { ok: true, message: "Service area deleted successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to delete service area."),
    };
  }
}
