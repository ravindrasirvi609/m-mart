import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";
import { formatOrderStatus } from "@/lib/utils";
import { sendPushToUser, sendPushToAdmins } from "@/lib/web-push";

type AdminSupabaseClient = SupabaseClient<Database>;
type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

export type NotificationRow =
  Database["public"]["Tables"]["notifications"]["Row"];

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

function isMissingNotificationsTableError(
  error: { code?: string; message?: string } | null,
) {
  if (!error) {
    return false;
  }

  const message = (error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    message.includes("public.notifications") ||
    message.includes('relation "notifications" does not exist')
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
      console.warn(
        "[Notifications] notifications table is missing in Supabase.",
      );
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

  const customerTitle = "Order placed";
  const customerMessage = `Order #${orderCode} has been placed successfully and is awaiting payment verification.`;
  const adminTitle = "New order received";
  const adminMessage = `${readableName} placed order #${orderCode}. Please verify payment and process it.`;

  await insertNotifications(
    [
      {
        user_id: customerId,
        order_id: orderId,
        target_role: "customer",
        kind: "order_placed",
        title: customerTitle,
        message: customerMessage,
      },
      {
        user_id: null,
        order_id: orderId,
        target_role: "admin",
        kind: "new_order",
        title: adminTitle,
        message: adminMessage,
      },
    ],
    client,
  );

  // Server-side Web Push (VAPID) — works in background/PWA
  await Promise.allSettled([
    sendPushToUser(customerId, {
      title: customerTitle,
      body: customerMessage,
      tag: `order-placed-${orderId}`,
      url: "/orders",
    }),
    sendPushToAdmins({
      title: adminTitle,
      body: adminMessage,
      tag: `admin-new-order-${orderId}`,
      url: "/admin/orders",
    }),
  ]);
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

  // Delivery-specific messages
  let title = "Order status updated";
  let message = `Order #${orderCode} is now ${formatOrderStatus(orderStatus)}. Payment status: ${formatOrderStatus(paymentStatus)}.`;
  let kind = "order_status_updated";

  if (orderStatus === "out_for_delivery") {
    title = "Your order is on its way! 🛵";
    message = `Order #${orderCode} is out for delivery. Track your delivery in real-time.`;
    kind = "out_for_delivery";
  } else if (orderStatus === "delivered") {
    title = "Order delivered! ✅";
    message = `Order #${orderCode} has been delivered. Thank you for shopping with Mmart!`;
    kind = "delivered";
  } else if (orderStatus === "preparing") {
    title = "Order is being prepared 👨‍🍳";
    message = `Order #${orderCode} is being prepared. You'll be notified when it's out for delivery.`;
    kind = "preparing";
  } else if (orderStatus === "cancelled") {
    title = "Order cancelled";
    message = `Order #${orderCode} has been cancelled. Please contact support for details.`;
    kind = "cancelled";
  }

  await insertNotifications(
    {
      user_id: customerId,
      order_id: orderId,
      target_role: "customer",
      kind,
      title,
      message,
    },
    client,
  );

  // Server-side Web Push (VAPID) — works in background/PWA
  await sendPushToUser(customerId, {
    title,
    body: message,
    tag: `order-status-${orderId}-${orderStatus}`,
    url: "/orders",
  }).catch((err) => {
    console.error("[Notifications] Push to user failed:", err);
  });
}

export async function createDeliveryAgentAssignedNotification(
  {
    orderId,
    customerId,
    agentName,
  }: {
    orderId: string;
    customerId: string;
    agentName: string;
  },
  client?: AdminSupabaseClient,
) {
  const orderCode = shortOrderId(orderId);
  const title = "Delivery agent assigned";
  const message = `${agentName} will deliver your order #${orderCode}. Track your order for live updates.`;

  await insertNotifications(
    {
      user_id: customerId,
      order_id: orderId,
      target_role: "customer",
      kind: "agent_assigned",
      title,
      message,
    },
    client,
  );

  // Server-side Web Push
  await sendPushToUser(customerId, {
    title,
    body: message,
    tag: `agent-assigned-${orderId}`,
    url: `/orders/${orderId}/track`,
  }).catch((err) => {
    console.error("[Notifications] Push for agent assign failed:", err);
  });
}
