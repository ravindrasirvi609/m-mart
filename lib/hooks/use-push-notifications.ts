"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playNotificationBell } from "@/lib/notification-sound";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PushPermission = "granted" | "denied" | "default" | "unsupported";

/* ------------------------------------------------------------------ */
/*  VAPID public key for push subscription                             */
/* ------------------------------------------------------------------ */

function getVapidPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;
}

/**
 * Convert a base64 VAPID key to Uint8Array for PushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Browser push notification hook with full VAPID push subscription.
 *
 * - Tracks permission state
 * - Subscribes to Web Push via VAPID when permission is granted
 * - Saves subscription to server (/api/push/subscribe)
 * - Provides `sendLocalPush()` for foreground-only notifications
 * - Plays an audio bell on notification
 * - Background push is handled server-side via web-push library
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission as PushPermission;
  });
  const [subscribed, setSubscribed] = useState(false);
  const subscriptionAttemptedRef = useRef(false);

  const permissionRef = useRef(permission);
  useEffect(() => {
    permissionRef.current = permission;
  }, [permission]);

  /* ----- Sync permission if user changes it in browser settings ----- */
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if ("permissions" in navigator) {
      let cleanup: (() => void) | null = null;

      navigator.permissions
        .query({ name: "notifications" })
        .then((status) => {
          const handler = () => setPermission(status.state as PushPermission);
          status.addEventListener("change", handler);
          cleanup = () => status.removeEventListener("change", handler);
        })
        .catch(() => undefined);

      return () => cleanup?.();
    }
  }, []);

  /* ----- Subscribe to Web Push (VAPID) ----- */
  const subscribeToPush = useCallback(async () => {
    if (subscriptionAttemptedRef.current) return;
    subscriptionAttemptedRef.current = true;

    const vapidKey = getVapidPublicKey();
    if (!vapidKey) {
      console.debug(
        "[Push] No VAPID public key configured, skipping push subscription",
      );
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.debug("[Push] PushManager not available");
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
        });
      }

      // Send subscription to server
      const subJson = subscription.toJSON();
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      });

      if (response.ok) {
        setSubscribed(true);
        console.info("[Push] ✓ Push subscription saved to server");
      } else {
        console.error(
          "[Push] Failed to save subscription:",
          await response.text(),
        );
      }
    } catch (err) {
      console.error("[Push] Subscription failed:", err);
    }
  }, []);

  /* ----- Auto-subscribe when permission is granted ----- */
  useEffect(() => {
    if (permission !== "granted" || subscribed) return;

    // Use a microtask to avoid synchronous setState in effect body
    const controller = new AbortController();
    const doSubscribe = async () => {
      if (!controller.signal.aborted) {
        await subscribeToPush();
      }
    };
    // Schedule outside effect's synchronous body
    const timeoutId = setTimeout(() => void doSubscribe(), 0);
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [permission, subscribed, subscribeToPush]);

  /* ----- Request permission ----- */
  const requestPermission = useCallback(async (): Promise<PushPermission> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      // Reset attempt flag so subscribeToPush runs again
      subscriptionAttemptedRef.current = false;
    }

    return result;
  }, []);

  /* ----- Send local push notification (foreground only) ----- */
  const sendPush = useCallback(
    async (
      title: string,
      body: string,
      options?: {
        tag?: string;
        url?: string;
        playSound?: boolean;
      },
    ) => {
      const { tag, url = "/orders", playSound = true } = options ?? {};

      if (playSound) {
        playNotificationBell();
      }

      // Only show foreground notification if permission is granted
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      // Don't show local notification if document is hidden
      // (server-side push will handle background notifications)
      if (document.visibilityState === "hidden") {
        return;
      }

      const notificationOptions = {
        body,
        tag,
        renotify: true,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        vibrate: [200, 100, 200],
        data: { url },
      };

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration) {
            await registration.showNotification(
              title,
              notificationOptions as NotificationOptions,
            );
            return;
          }
        }

        // Fallback
        new Notification(title, { body, tag });
      } catch (error) {
        console.error("[Push] Failed to show notification:", error);
      }
    },
    [],
  );

  return { permission, subscribed, requestPermission, sendPush };
}
