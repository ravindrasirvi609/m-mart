"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminForAction } from "@/lib/auth";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { toPublicErrorMessage } from "@/lib/security/errors";
import { assertTrustedRequestOrigin } from "@/lib/security/request";

/* ---------- JSON shape from the user's bulk file ---------- */
const bulkItemSchema = z.object({
  name: z.string().min(1),
  net_qty: z.string().optional().default(""),
  offer_price: z.string().optional().default(""),
  discount: z.string().optional().default(""),
  mrp: z.string().optional().default(""),
  category: z.string().optional().default("General"),
  image_urls: z.string().optional().default("[]"),
  product_highlights: z.string().optional().default(""),
  description: z.string().optional().default(""),
  // Also accept already-parsed numeric fields for flexibility
  price: z.coerce.number().optional(),
  discount_price: z.coerce.number().optional(),
  stock: z.coerce.number().int().optional(),
  image_url: z.string().optional(),
});

type BulkItem = z.infer<typeof bulkItemSchema>;

/* ---------- Helpers ---------- */

/** Parse "₹95" / "₹1,200" / "95" → number */
function parsePrice(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹,\s]/g, "").trim();
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/** Parse a Python-style list string into a JS array of URLs */
function parseImageUrls(raw: string): string[] {
  if (!raw || raw === "[]") return [];

  // If it's already valid JSON array
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.filter(
        (u: unknown) => typeof u === "string" && u.length > 0,
      );
  } catch {
    // Not JSON, try Python-style
  }

  // Python-style: "['url1', 'url2']"
  try {
    const jsonified = raw.replace(/'/g, '"');
    const parsed = JSON.parse(jsonified);
    if (Array.isArray(parsed))
      return parsed.filter(
        (u: unknown) => typeof u === "string" && u.length > 0,
      );
  } catch {
    // Try comma-separated
  }

  // Fallback: comma-separated
  return raw
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((s) => s.replace(/['"]/g, "").trim())
    .filter(Boolean);
}

/** Parse Python-style dict string or JSON into a Record */
function parseHighlights(raw: string): Record<string, string> | null {
  if (!raw || raw === "{}") return null;

  // Standard JSON
  try {
    const parsed = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Not JSON
  }

  // Python-style: {'key': 'value'}
  try {
    const jsonified = raw.replace(/'/g, '"');
    const parsed = JSON.parse(jsonified);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
    ) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Give up
  }

  return null;
}

/** Map a single incoming JSON item → DB row payload */
function mapToProduct(item: BulkItem) {
  const imageUrls = parseImageUrls(item.image_urls ?? "");
  const primaryImage = item.image_url || imageUrls[0] || "";

  const mrpPrice = item.price ?? parsePrice(item.mrp ?? "") ?? 0;
  const offerPrice = item.discount_price ?? parsePrice(item.offer_price ?? "");

  const highlights = parseHighlights(item.product_highlights ?? "");

  // Clean up description – remove embedded Python dict if present
  let description = item.description || item.name;
  if (description.includes("{'") || description.includes('{"')) {
    const dictStart = description.indexOf("{");
    if (dictStart > 0) {
      description = description
        .substring(0, dictStart)
        .replace(/Key features include:\s*$/i, "")
        .trim();
    }
  }
  if (!description) description = item.name;

  return {
    name: item.name.trim(),
    description,
    price: mrpPrice,
    discount_price:
      offerPrice !== null && offerPrice > 0 && offerPrice < mrpPrice
        ? offerPrice
        : null,
    stock: item.stock ?? 10, // default stock for bulk uploads
    category: (item.category || "General").trim(),
    image_url: primaryImage,
    image_urls: imageUrls,
    net_qty: item.net_qty?.trim() || null,
    product_highlights: highlights,
    is_active: true,
  };
}

/* ---------- Server Action ---------- */

export async function bulkUploadProductsAction(jsonString: string) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    // Parse the JSON input
    let rawItems: unknown[];
    try {
      const parsed = JSON.parse(jsonString);
      rawItems = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return {
        ok: false,
        error: "Invalid JSON. Please paste a valid JSON array of products.",
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };
    }

    if (rawItems.length === 0) {
      return {
        ok: false,
        error: "No products found in the JSON data.",
        imported: 0,
        skipped: 0,
        errors: [] as string[],
      };
    }

    const admin = createAdminSupabaseClient();

    // Auto-create missing categories
    const categoryNames = new Set<string>();
    for (const raw of rawItems) {
      const parsed = bulkItemSchema.safeParse(raw);
      if (parsed.success && parsed.data.category) {
        categoryNames.add(parsed.data.category.trim());
      }
    }

    if (categoryNames.size > 0) {
      const categoryRows = [...categoryNames].map((name) => ({
        name,
        is_active: true,
      }));
      // upsert ignores conflicts on unique name
      await admin
        .from("categories")
        .upsert(categoryRows, { onConflict: "name" });
    }

    // Process products
    const errors: string[] = [];
    const products: ReturnType<typeof mapToProduct>[] = [];
    let skipped = 0;

    for (let i = 0; i < rawItems.length; i++) {
      const parsed = bulkItemSchema.safeParse(rawItems[i]);
      if (!parsed.success) {
        errors.push(
          `Item ${i + 1}: ${parsed.error.issues.map((e: { message: string }) => e.message).join(", ")}`,
        );
        skipped++;
        continue;
      }

      const mapped = mapToProduct(parsed.data);

      if (!mapped.name) {
        errors.push(`Item ${i + 1}: Missing product name.`);
        skipped++;
        continue;
      }

      if (!mapped.image_url) {
        errors.push(`Item ${i + 1} (${mapped.name}): No image URL found.`);
        skipped++;
        continue;
      }

      products.push(mapped);
    }

    if (products.length === 0) {
      return {
        ok: false,
        error: "No valid products to import.",
        imported: 0,
        skipped,
        errors,
      };
    }

    // Insert in batches of 50
    const batchSize = 50;
    let imported = 0;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const { error } = await admin.from("products").insert(batch);

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
        skipped += batch.length;
      } else {
        imported += batch.length;
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return {
      ok: imported > 0,
      message: `Successfully imported ${imported} product${imported !== 1 ? "s" : ""}.${skipped > 0 ? ` ${skipped} skipped.` : ""}`,
      imported,
      skipped,
      errors,
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Bulk upload failed."),
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };
  }
}
