"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminForAction } from "@/lib/auth";
import { createOrderStatusUpdateNotification } from "@/lib/notifications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/lib/constants";
import { toPublicErrorMessage } from "@/lib/security/errors";
import { assertTrustedRequestOrigin } from "@/lib/security/request";
import { validateImageFile } from "@/lib/security/upload";
import { sanitizeFileName } from "@/lib/utils";

const categorySchema = z.object({
  name: z.string().trim().min(2).max(60),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(4).max(1000),
  price: z.coerce.number().min(0),
  discount_price: z.string().optional(),
  stock: z.coerce.number().int().min(0),
  category: z.string().trim().min(2).max(60),
  image_url: z.string().trim().url().or(z.literal("")),
  image_urls: z.string().optional(),
  net_qty: z.string().trim().max(50).optional(),
  product_highlights: z.string().optional(),
  is_active: z.enum(["on", "off"]).optional(),
});

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function getImageFile(entry: FormDataEntryValue | null) {
  if (typeof File !== "undefined" && entry instanceof File && entry.size > 0) {
    return entry;
  }
  return null;
}

async function uploadProductImage(file: File) {
  await validateImageFile(file, {
    allowedMimeTypes: allowedImageTypes,
    maxBytes: 4 * 1024 * 1024,
  });

  const admin = createAdminSupabaseClient();
  const filePath = `products/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { data, error } = await admin.storage
    .from("product-images")
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("product-images").getPublicUrl(data.path);

  return publicUrl;
}

export async function upsertCategoryAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = categorySchema.safeParse({
      name: formData.get("name"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Category name is invalid." };
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("categories").upsert({
      name: parsed.data.name,
      is_active: true,
    });

    if (error) {
      return { ok: false, error: "Unable to save category. Please try again." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { ok: true, message: "Category saved successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to save category."),
    };
  }
}

export async function upsertProductAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();
    const parsed = productSchema.safeParse({
      id: formData.get("id") || undefined,
      name: formData.get("name"),
      description: formData.get("description"),
      price: formData.get("price"),
      discount_price: formData.get("discount_price"),
      stock: formData.get("stock"),
      category: formData.get("category"),
      image_url: formData.get("image_url") || "",
      image_urls: formData.get("image_urls") || "",
      net_qty: formData.get("net_qty") || "",
      product_highlights: formData.get("product_highlights") || "",
      is_active: formData.get("is_active") === "on" ? "on" : "off",
    });

    if (!parsed.success) {
      return { ok: false, error: "Product form is invalid." };
    }

    const imageFile = getImageFile(formData.get("image_file"));
    const admin = createAdminSupabaseClient();

    let imageUrl = parsed.data.image_url;
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }

    if (!imageUrl) {
      return {
        ok: false,
        error: "Provide an image URL or upload an image file.",
      };
    }

    const discountRaw = (parsed.data.discount_price || "").trim();
    const discountValue =
      discountRaw.length === 0 ? null : Number.parseFloat(discountRaw);

    if (
      discountValue !== null &&
      (!Number.isFinite(discountValue) || discountValue <= 0)
    ) {
      return { ok: false, error: "Discount price must be a positive number." };
    }

    // Parse image_urls JSON array
    let imageUrlsArray: string[] = [];
    const rawImageUrls = (parsed.data.image_urls || "").trim();
    if (rawImageUrls) {
      try {
        imageUrlsArray = JSON.parse(rawImageUrls);
      } catch {
        imageUrlsArray = rawImageUrls
          .split(",")
          .map((u: string) => u.trim())
          .filter(Boolean);
      }
    }

    // Parse product_highlights JSON
    let highlights: Record<string, string> | null = null;
    const rawHighlights = (parsed.data.product_highlights || "").trim();
    if (rawHighlights) {
      try {
        highlights = JSON.parse(rawHighlights);
      } catch {
        highlights = null;
      }
    }

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      discount_price: discountValue,
      stock: parsed.data.stock,
      category: parsed.data.category,
      image_url: imageUrl,
      image_urls: imageUrlsArray,
      net_qty: parsed.data.net_qty || null,
      product_highlights: highlights,
      is_active: parsed.data.is_active === "on",
    };

    if (parsed.data.id) {
      const { error } = await admin
        .from("products")
        .update(payload)
        .eq("id", parsed.data.id);

      if (error) {
        return { ok: false, error: "Unable to update product right now." };
      }
    } else {
      const { error } = await admin.from("products").insert(payload);

      if (error) {
        return { ok: false, error: "Unable to create product right now." };
      }
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return {
      ok: true,
      message: parsed.data.id
        ? "Product updated successfully."
        : "Product created successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to save product."),
    };
  }
}

export async function deleteProductAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();
    const idPayload = z.string().uuid().safeParse(formData.get("id"));
    if (!idPayload.success) {
      return { ok: false, error: "Missing product id." };
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin
      .from("products")
      .delete()
      .eq("id", idPayload.data);

    if (error) {
      return { ok: false, error: "Unable to delete product right now." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { ok: true, message: "Product deleted successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to delete product."),
    };
  }
}

const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  paymentStatus: z.enum(PAYMENT_STATUS_OPTIONS),
  orderStatus: z.enum(ORDER_STATUS_OPTIONS),
});

export async function updateOrderStatusAction(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    await assertTrustedRequestOrigin();
    await assertAdminForAction();

    const parsed = orderStatusSchema.safeParse({
      orderId: formData.get("order_id"),
      paymentStatus: formData.get("payment_status"),
      orderStatus: formData.get("order_status"),
    });

    if (!parsed.success) {
      return { ok: false, error: "Invalid order status payload." };
    }

    const admin = createAdminSupabaseClient();
    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id,user_id,payment_status,order_status")
      .eq("id", parsed.data.orderId)
      .single();

    if (orderError || !order) {
      return { ok: false, error: "Order not found." };
    }

    const hasStatusChange =
      order.payment_status !== parsed.data.paymentStatus ||
      order.order_status !== parsed.data.orderStatus;

    if (!hasStatusChange) {
      return { ok: true, message: "No changes detected." };
    }

    const { error } = await admin
      .from("orders")
      .update({
        payment_status: parsed.data.paymentStatus,
        order_status: parsed.data.orderStatus,
      })
      .eq("id", parsed.data.orderId);

    if (error) {
      return { ok: false, error: "Unable to update order status right now." };
    }

    await createOrderStatusUpdateNotification(
      {
        orderId: order.id,
        customerId: order.user_id,
        paymentStatus: parsed.data.paymentStatus,
        orderStatus: parsed.data.orderStatus,
      },
      admin,
    ).catch((notificationError) => {
      void notificationError;
    });

    revalidatePath("/admin/orders");
    revalidatePath("/orders");
    revalidatePath("/admin");

    return { ok: true, message: "Order status updated successfully." };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Failed to update status."),
    };
  }
}
