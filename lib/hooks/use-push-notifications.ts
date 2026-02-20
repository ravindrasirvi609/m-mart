"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playNotificationBell } from "@/lib/notification-sound";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type PushPermission = "granted" | "denied" | "default" | "unsupported";

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Browser push notification hook.
 *
 * - Tracks permission state
 * - Provides `requestPermission()` for manual prompt
 * - Provides `sendPush()` to fire a notification via
 *   service worker (or plain Notification fallback)
 * - Plays an audio bell on every `sendPush()` call
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermission>("default");

  // On mount, sync permission state to overcome hydration mismatch
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, []);

    const permissionRef = useRef(permission);
    useEffect(() => {
        permissionRef.current = permission;
    }, [permission]);

    /* ----- Sync permission if user changes it in browser settings ----- */
    useEffect(() => {
        if (typeof window === "undefined" || !("Notification" in window)) return;

        // Permissions API lets us listen for changes
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

    /* ----- Request permission ----- */
    const requestPermission = useCallback(async (): Promise<PushPermission> => {
        if (typeof window === "undefined" || !("Notification" in window)) {
            return "unsupported";
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        // Ensure service worker is ready after granting
        if (result === "granted" && "serviceWorker" in navigator) {
            try {
                await navigator.serviceWorker.ready;
            } catch {
                // SW not available — will fall back to plain Notification
            }
        }

        return result;
    }, []);

    /* ----- Send push notification ----- */
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

            // Always play the bell sound
            if (playSound) {
                playNotificationBell();
            }

            // Check permission at call time
            if (
                typeof window === "undefined" ||
                !("Notification" in window) ||
                Notification.permission !== "granted"
            ) {
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
                // Prefer service worker notification (works in background)
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

                // Fallback to basic Notification API
                new Notification(title, { body, tag });
            } catch (error) {
                console.error("[Push] Failed to show notification:", error);
            }
        },
        [],
    );

    return { permission, requestPermission, sendPush };
}
