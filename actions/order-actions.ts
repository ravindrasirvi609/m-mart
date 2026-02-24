"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUserForAction } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { sendLowStockEmail, sendOrderEmails } from "@/lib/email";
import { createOrderPlacedNotifications } from "@/lib/notifications";
import { toPublicErrorMessage } from "@/lib/security/errors";
import { assertTrustedRequestOrigin } from "@/lib/security/request";
import { validateImageFile } from "@/lib/security/upload";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { sanitizeFileName } from "@/lib/utils";

const cartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().max(20),
});

const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .min(10)
    .max(15)
    .regex(/^[0-9+\-\s]+$/),
  address: z.string().trim().min(10).max(400),
});

const allowedScreenshotTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
]);

type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string };

function getFile(entry: FormDataEntryValue | null): File | null {
  if (typeof File !== "undefined" && entry instanceof File && entry.size > 0) {
    return entry;
  }

  return null;
}

async function uploadPaymentScreenshot(file: File, userId: string) {
  await validateImageFile(file, {
    allowedMimeTypes: allowedScreenshotTypes,
    maxBytes: 5 * 1024 * 1024,
  });

  const admin = createAdminSupabaseClient();
  const filePath = `payments/${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { data, error } = await admin.storage
    .from("payment-screenshots")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("payment-screenshots").getPublicUrl(data.path);

  return publicUrl;
}

export async function placeOrderAction(formData: FormData): Promise<PlaceOrderResult> {
  try {
    await assertTrustedRequestOrigin();
    const user = await assertUserForAction();
    const admin = createAdminSupabaseClient();

    const profilePayload = checkoutSchema.safeParse({
      name: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
    });

    if (!profilePayload.success) {
      return { ok: false, error: "Delivery details are invalid." };
    }

    const rawCart = String(formData.get("cart_payload") || "[]");
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawCart) as unknown;
    } catch {
      return { ok: false, error: "Cart payload is invalid." };
    }

    const cartValidation = z.array(cartItemSchema).min(1).safeParse(parsedJson);

    if (!cartValidation.success) {
      return { ok: false, error: "Cart payload is invalid." };
    }

    const screenshot = getFile(formData.get("payment_screenshot"));

    if (!screenshot) {
      return { ok: false, error: "Payment screenshot is required." };
    }

    const productIds = cartValidation.data.map((item) => item.productId);

    const { data: products, error: productError } = await admin
      .from("products")
      .select("id,name,price,discount_price,stock")
      .in("id", productIds);

    if (productError) {
      return { ok: false, error: "Unable to validate cart items at this time." };
    }

    const productMap = new Map(products?.map((item) => [item.id, item]));
    for (const item of cartValidation.data) {
      const product = productMap.get(item.productId);

      if (!product) {
        return { ok: false, error: "One of the products is not available." };
      }

      if (item.quantity > product.stock) {
        return {
          ok: false,
          error: `Only ${product.stock} unit(s) left for ${product.name}.`,
        };
      }
    }

    const screenshotUrl = await uploadPaymentScreenshot(screenshot, user.id);

    const deliveryAddress = {
      name: profilePayload.data.name,
      phone: profilePayload.data.phone,
      address: profilePayload.data.address,
    };

    const { data: rpcData, error: rpcError } = await admin.rpc(
      "place_order_with_items",
      {
        p_user_id: user.id,
        p_payment_screenshot_url: screenshotUrl,
        p_delivery_address: deliveryAddress,
        p_items: cartValidation.data,
      },
    );

    if (rpcError) {
      return { ok: false, error: "Unable to place order right now. Please try again." };
    }

    const orderResult = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const orderId = orderResult?.order_id as string | undefined;

    if (!orderId) {
      return { ok: false, error: "Order could not be placed." };
    }

    await admin.from("users").upsert({
      id: user.id,
      email: user.email ?? "",
      name: profilePayload.data.name,
      phone: profilePayload.data.phone,
      address: profilePayload.data.address,
    });

    const { data: refreshedProducts } = await admin
      .from("products")
      .select("name,stock")
      .in("id", productIds)
      .lte("stock", LOW_STOCK_THRESHOLD);

    const emailItems = cartValidation.data.map((item) => {
      const product = productMap.get(item.productId)!;
      const effectivePrice =
        product.discount_price === null
          ? Number(product.price)
          : Math.min(Number(product.price), Number(product.discount_price));

      return {
        name: product.name,
        quantity: item.quantity,
        price: effectivePrice,
      };
    });

    await createOrderPlacedNotifications(
      {
        orderId,
        customerId: user.id,
        customerName: profilePayload.data.name,
      },
      admin,
    ).catch((error) => {
      void error;
    });

    await Promise.allSettled([
      sendOrderEmails({
        orderId,
        customerEmail: user.email ?? "",
        customerName: profilePayload.data.name,
        deliveryAddress: profilePayload.data.address,
        items: emailItems,
        total: Number(orderResult.total_amount ?? 0),
        paymentStatus: "Pending Verification",
      }),
      sendLowStockEmail(refreshedProducts ?? []),
    ]);

    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/products");
    revalidatePath("/");

    return { ok: true, orderId };
  } catch (error) {
    return {
      ok: false,
      error: toPublicErrorMessage(error, "Unexpected error while placing order."),
    };
  }
}
