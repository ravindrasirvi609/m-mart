"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { assertUserForAction } from "@/lib/auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { sendLowStockEmail, sendOrderEmails } from "@/lib/email";
import { createOrderPlacedNotifications } from "@/lib/notifications";
import { toPublicErrorMessage, AuthError } from "@/lib/security/errors";
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

  let data;
  let error;
  try {
    const result = await admin.storage
      .from("payment-screenshots")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });
    data = result.data;
    error = result.error;
  } catch (uploadErr) {
    throw new Error(
      `Screenshot upload failed: ${uploadErr instanceof Error ? uploadErr.message : "Network error"}`,
    );
  }

  if (error) {
    throw new Error(`Screenshot upload failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Screenshot upload returned no data.");
  }

  const {
    data: { publicUrl },
  } = admin.storage.from("payment-screenshots").getPublicUrl(data.path);

  return publicUrl;
}

export async function placeOrderAction(
  formData: FormData,
): Promise<PlaceOrderResult> {
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
      return {
        ok: false,
        error: "Unable to validate cart items at this time.",
      };
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

    const rawLat = formData.get("delivery_lat");
    const rawLng = formData.get("delivery_lng");
    const deliveryLat = rawLat ? Number(rawLat) : null;
    const deliveryLng = rawLng ? Number(rawLng) : null;

    const rpcParams: Record<string, unknown> = {
      p_user_id: user.id,
      p_payment_screenshot_url: screenshotUrl,
      p_delivery_address: deliveryAddress,
      p_items: cartValidation.data,
    };

    if (
      deliveryLat !== null &&
      deliveryLng !== null &&
      Number.isFinite(deliveryLat) &&
      Number.isFinite(deliveryLng)
    ) {
      rpcParams.p_lat = deliveryLat;
      rpcParams.p_lng = deliveryLng;
    }

    let rpcData;
    let rpcError;
    try {
      const rpcResult = await admin.rpc(
        "place_order_with_items",
        rpcParams as never,
      );
      rpcData = rpcResult.data;
      rpcError = rpcResult.error;
    } catch (rpcErr) {
      return {
        ok: false,
        error: `Unable to place order: ${rpcErr instanceof Error ? rpcErr.message : "network error"}. Please try again.`,
      };
    }

    if (rpcError) {
      // Surface the actual RPC error for common issues
      const msg = rpcError.message ?? "";
      if (msg.includes("Insufficient stock")) {
        return { ok: false, error: msg };
      }
      if (msg.includes("Product not found")) {
        return {
          ok: false,
          error: "One of the products is no longer available.",
        };
      }
      if (msg.includes("Cart is empty")) {
        return { ok: false, error: "Your cart is empty." };
      }
      return {
        ok: false,
        error: `Unable to place order right now. Please try again. (${msg})`,
      };
    }

    const orderResult = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const orderId = orderResult?.order_id as string | undefined;

    if (!orderId) {
      return {
        ok: false,
        error: "Order could not be placed. Please try again.",
      };
    }

    // Record initial status in timeline
    try {
      await admin.from("order_status_history").insert({
        order_id: orderId,
        order_status: "pending",
        payment_status: "pending_verification",
        changed_by: user.id,
        note: "Order placed",
      } as never);
    } catch {
      // ignore — table may not exist yet
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
        total: Number(orderResult?.total_amount ?? 0),
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
    // For auth errors, return the specific message so users know to log in
    if (error instanceof AuthError) {
      return { ok: false, error: error.message };
    }

    // For upload or known errors, include context
    if (error instanceof Error && error.message.includes("Screenshot upload")) {
      return {
        ok: false,
        error:
          "Failed to upload payment screenshot. Please try a smaller image or different format.",
      };
    }

    return {
      ok: false,
      error: toPublicErrorMessage(
        error,
        "Unexpected error while placing order. Please try again.",
      ),
    };
  }
}
