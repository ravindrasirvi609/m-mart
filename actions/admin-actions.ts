"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminForAction } from "@/lib/auth";
import { createOrderStatusUpdateNotification } from "@/lib/notifications";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/lib/constants";
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
  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Unsupported product image format.");
  }

  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Product image must be smaller than 4MB.");
  }

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

export async function upsertCategoryAction(_prevState: unknown, formData: FormData) {
  try {
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
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { ok: true, message: "Category saved successfully." };
  } catch (error) {
    console.error("Error upserting category:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save category",
    };
  }
}

export async function upsertProductAction(_prevState: unknown, formData: FormData) {
  try {
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
      is_active: formData.get("is_active") === "on" ? "on" : "off",
    });

    if (!parsed.success) {
      console.error("Product validation failed:", parsed.error.format());
      return { ok: false, error: "Product form is invalid." };
    }

    const imageFile = getImageFile(formData.get("image_file"));
    const admin = createAdminSupabaseClient();

    let imageUrl = parsed.data.image_url;
    if (imageFile) {
      imageUrl = await uploadProductImage(imageFile);
    }

    if (!imageUrl) {
      return { ok: false, error: "Provide an image URL or upload an image file." };
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

    const payload = {
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      discount_price: discountValue,
      stock: parsed.data.stock,
      category: parsed.data.category,
      image_url: imageUrl,
      is_active: parsed.data.is_active === "on",
    };

    if (parsed.data.id) {
      const { error } = await admin
        .from("products")
        .update(payload)
        .eq("id", parsed.data.id);

      if (error) {
        return { ok: false, error: error.message };
      }
    } else {
      const { error } = await admin.from("products").insert(payload);

      if (error) {
        return { ok: false, error: error.message };
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
    console.error("Error upserting product:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to save product",
    };
  }
}

export async function deleteProductAction(_prevState: unknown, formData: FormData) {
  try {
    await assertAdminForAction();
    const id = String(formData.get("id") || "");

    if (!id) {
      return { ok: false, error: "Missing product id." };
    }

    const admin = createAdminSupabaseClient();
    const { error } = await admin.from("products").delete().eq("id", id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");

    return { ok: true, message: "Product deleted successfully." };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to delete product",
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
      return { ok: false, error: orderError?.message ?? "Order not found." };
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
      return { ok: false, error: error.message };
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
      console.error(
        `[Orders] Failed to create status notification for order ${order.id}:`,
        notificationError,
      );
    });

    revalidatePath("/admin/orders");
    revalidatePath("/orders");
    revalidatePath("/admin");

    return { ok: true, message: "Order status updated successfully." };
  } catch (error) {
    console.error("Error updating order status:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update status",
    };
  }
}
