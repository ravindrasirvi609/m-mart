"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertAdminForAction } from "@/lib/auth";
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
  price: z.coerce.number().positive(),
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

export async function upsertCategoryAction(formData: FormData) {
  await assertAdminForAction();

  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    throw new Error("Category name is invalid.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("categories").upsert({
    name: parsed.data.name,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
}

export async function upsertProductAction(formData: FormData) {
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
    throw new Error("Product form is invalid.");
  }

  const imageFile = getImageFile(formData.get("image_file"));
  const admin = createAdminSupabaseClient();

  let imageUrl = parsed.data.image_url;
  if (imageFile) {
    imageUrl = await uploadProductImage(imageFile);
  }

  if (!imageUrl) {
    throw new Error("Provide an image URL or upload an image file.");
  }

  const discountRaw = (parsed.data.discount_price || "").trim();
  const discountValue =
    discountRaw.length === 0 ? null : Number.parseFloat(discountRaw);

  if (discountValue !== null && (!Number.isFinite(discountValue) || discountValue <= 0)) {
    throw new Error("Discount price must be a positive number.");
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
      throw new Error(error.message);
    }
  } else {
    const { error } = await admin.from("products").insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function deleteProductAction(formData: FormData) {
  await assertAdminForAction();
  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("Missing product id.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

const orderStatusSchema = z.object({
  orderId: z.string().uuid(),
  paymentStatus: z.enum(PAYMENT_STATUS_OPTIONS),
  orderStatus: z.enum(ORDER_STATUS_OPTIONS),
});

export async function updateOrderStatusAction(formData: FormData) {
  await assertAdminForAction();

  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("order_id"),
    paymentStatus: formData.get("payment_status"),
    orderStatus: formData.get("order_status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid order status payload.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("orders")
    .update({
      payment_status: parsed.data.paymentStatus,
      order_status: parsed.data.orderStatus,
    })
    .eq("id", parsed.data.orderId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/orders");
  revalidatePath("/admin");
}
