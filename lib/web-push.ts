/**
 * Server-side Web Push (VAPID) notification sender.
 *
 * Sends real push notifications to browsers and PWAs, even when the app
 * is minimized or the tab is closed. Works with the service worker's
 * `push` event handler in /public/sw.js.
 *
 * Required env vars:
 *   VAPID_PUBLIC_KEY   — Base64-encoded VAPID public key
 *   VAPID_PRIVATE_KEY  — Base64-encoded VAPID private key
 *   VAPID_SUBJECT      — mailto: or https: identifier
 */

import webpush from "web-push";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

/* ------------------------------------------------------------------ */
/*  VAPID Configuration                                                */
/* ------------------------------------------------------------------ */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:support@mmart4u.com";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn(
      "[WebPush] VAPID keys not configured. Server-side push notifications disabled.",
    );
    return false;
  }

  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch (err) {
    console.error("[WebPush] Failed to configure VAPID:", err);
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PushPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
  icon?: string;
  badge?: string;
}

interface PushSubscriptionRecord {
  id: string;
  endpoint: string;
  keys_p256dh: string;
  keys_auth: string;
}

/* ------------------------------------------------------------------ */
/*  Core push send function                                            */
/* ------------------------------------------------------------------ */

async function sendToSubscription(
  sub: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<{ success: boolean; expired: boolean }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 }, // 1 hour TTL
    );
    return { success: true, expired: false };
  } catch (err: unknown) {
    const statusCode =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode: number }).statusCode
        : 0;

    // 404 or 410 means the subscription is invalid/expired — remove it
    if (statusCode === 404 || statusCode === 410) {
      console.info(`[WebPush] Subscription expired, removing: ${sub.id}`);
      return { success: false, expired: true };
    }

    console.error(`[WebPush] Failed to send to ${sub.id}:`, err);
    return { success: false, expired: false };
  }
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Send push notification to a specific user (all their subscriptions).
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<void> {
  if (!ensureVapidConfigured()) return;

  const admin = createAdminSupabaseClient();
  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .eq("user_id", userId);

  if (error) {
    console.error("[WebPush] Failed to fetch subscriptions:", error.message);
    return;
  }

  if (!subscriptions || subscriptions.length === 0) return;

  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendToSubscription(
        sub as PushSubscriptionRecord,
        payload,
      );
      if (result.expired) {
        expiredIds.push(sub.id);
      }
    }),
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds)
      .then(({ error: delErr }) => {
        if (delErr) {
          console.error(
            "[WebPush] Failed to clean expired subs:",
            delErr.message,
          );
        }
      });
  }
}

/**
 * Send push notification to all admin users.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  if (!ensureVapidConfigured()) return;

  const admin = createAdminSupabaseClient();

  // Get all admin emails
  const { data: adminUsers, error: adminErr } = await admin
    .from("admin_users")
    .select("email");

  if (adminErr || !adminUsers || adminUsers.length === 0) return;

  // Get user IDs for admin emails
  const adminEmails = adminUsers.map((a) => a.email.toLowerCase());
  const { data: users, error: usersErr } = await admin
    .from("users")
    .select("id, email");

  if (usersErr || !users) return;

  const adminUserIds = users
    .filter((u) => u.email && adminEmails.includes(u.email.toLowerCase()))
    .map((u) => u.id);

  if (adminUserIds.length === 0) return;

  // Get all push subscriptions for admin users
  const { data: subscriptions, error: subErr } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, keys_p256dh, keys_auth")
    .in("user_id", adminUserIds);

  if (subErr || !subscriptions || subscriptions.length === 0) return;

  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const result = await sendToSubscription(
        sub as PushSubscriptionRecord,
        payload,
      );
      if (result.expired) {
        expiredIds.push(sub.id);
      }
    }),
  );

  if (expiredIds.length > 0) {
    await admin
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds)
      .then(({ error: delErr }) => {
        if (delErr) {
          console.error(
            "[WebPush] Failed to clean expired admin subs:",
            delErr.message,
          );
        }
      });
  }
}
