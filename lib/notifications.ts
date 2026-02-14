import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { formatOrderStatus } from "@/lib/utils";

type AdminSupabaseClient = SupabaseClient<Database>;
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

function isMissingNotificationsTableError(error: { code?: string; message?: string } | null) {
  if (!error) {
    return false;
  }

  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    message.includes("public.notifications") ||
    message.includes("relation \"notifications\" does not exist")
  );
}

async function insertNotifications(
  payload: NotificationInsert | NotificationInsert[],
  client?: AdminSupabaseClient,
) {
  const admin = client ?? createAdminSupabaseClient();
  const { error } = Array.isArray(payload)
    ? await admin.from("notifications").insert(payload)
    : await admin.from("notifications").insert(payload);

  if (error) {
    if (isMissingNotificationsTableError(error)) {
      console.warn("[Notifications] notifications table is missing in Supabase.");
      return;
    }

    throw new Error(error.message);
  }
}

export async function createOrderPlacedNotifications(
  {
    orderId,
    customerId,
    customerName,
  }: {
    orderId: string;
    customerId: string;
    customerName: string;
  },
  client?: AdminSupabaseClient,
) {
  const orderCode = shortOrderId(orderId);
  const readableName = customerName.trim() || "Customer";

  await insertNotifications(
    [
      {
        user_id: customerId,
        order_id: orderId,
        target_role: "customer",
        kind: "order_placed",
        title: "Order placed",
        message: `Order #${orderCode} has been placed successfully and is awaiting payment verification.`,
      },
      {
        user_id: null,
        order_id: orderId,
        target_role: "admin",
        kind: "new_order",
        title: "New order received",
        message: `${readableName} placed order #${orderCode}. Please verify payment and process it.`,
      },
    ],
    client,
  );
}

export async function createOrderStatusUpdateNotification(
  {
    orderId,
    customerId,
    orderStatus,
    paymentStatus,
  }: {
    orderId: string;
    customerId: string;
    orderStatus: Database["public"]["Tables"]["orders"]["Row"]["order_status"];
    paymentStatus: Database["public"]["Tables"]["orders"]["Row"]["payment_status"];
  },
  client?: AdminSupabaseClient,
) {
  const orderCode = shortOrderId(orderId);

  await insertNotifications(
    {
      user_id: customerId,
      order_id: orderId,
      target_role: "customer",
      kind: "order_status_updated",
      title: "Order status updated",
      message: `Order #${orderCode} is now ${formatOrderStatus(orderStatus)}. Payment status: ${formatOrderStatus(paymentStatus)}.`,
    },
    client,
  );
}
