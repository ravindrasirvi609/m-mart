"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { markNotificationsReadAction } from "@/actions/notification-actions";
import { Button } from "@/components/ui/button";
import { playNotificationBell } from "@/lib/notification-sound";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { cn, formatOrderStatus } from "@/lib/utils";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

type NotificationCenterProps = {
  mode: "admin" | "customer";
  userId: string;
  initialNotifications: NotificationRow[];
  notificationsAvailable: boolean;
  className?: string;
};

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isPushSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

function isMissingNotificationsTableMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("public.notifications") ||
    normalized.includes("relation \"notifications\" does not exist")
  );
}

function shortOrderId(orderId: string) {
  return orderId.slice(0, 8).toUpperCase();
}

export function NotificationCenter({
  mode,
  userId,
  initialNotifications,
  notificationsAvailable,
  className,
}: NotificationCenterProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [useOrdersFallback, setUseOrdersFallback] = useState(!notificationsAvailable);
  const [hasRealtimeSession, setHasRealtimeSession] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    isPushSupported() ? Notification.permission : "unsupported",
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const reconnectTimerRef = useRef<number | null>(null);

  const unreadCount = notifications.reduce((count, entry) => {
    return count + (entry.is_read ? 0 : 1);
  }, 0);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    setUseOrdersFallback(!notificationsAvailable);
  }, [notificationsAvailable]);

  useEffect(() => {
    let mounted = true;

    const bootstrapSession = async () => {
      const [{ data: sessionData }, { data: userData, error: userError }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser(),
      ]);
      if (!mounted) {
        return;
      }

      setHasRealtimeSession(Boolean(sessionData.session || userData.user) && !userError);
    };

    void bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasRealtimeSession(Boolean(session));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const pushVisualNotification = useCallback(
    (title: string, message: string, tag: string) => {
      toast(title, { description: message });

      // Play audible bell for admin notifications
      if (mode === "admin") {
        playNotificationBell();
      }

      if (
        !isPushSupported() ||
        Notification.permission !== "granted"
      ) {
        return;
      }

      const destination = mode === "admin" ? "/admin/orders" : "/orders";

      const showSystemNotification = async () => {
        try {
          if ("serviceWorker" in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();

            if (registration) {
              await registration.showNotification(title, {
                body: message,
                tag,
                renotify: true,
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-192x192.png",
                vibrate: [200, 100, 200],
                data: { url: destination },
              } as NotificationOptions);
              return;
            }
          }

          new Notification(title, {
            body: message,
            tag,
            data: { url: destination },
          });
        } catch (error) {
          console.error("[Notifications] Failed to display browser notification:", error);
        }
      };

      void showSystemNotification();
    },
    [mode],
  );

  const pushRuntimeNotification = useCallback(
    (title: string, message: string, tag: string) => {
      const runtimeNotification: NotificationRow = {
        id: tag,
        created_at: new Date().toISOString(),
        is_read: false,
        kind: "runtime_fallback",
        message,
        order_id: null,
        target_role: mode,
        title,
        user_id: mode === "customer" ? userId : null,
      };

      setNotifications((current) => {
        if (current.some((entry) => entry.id === runtimeNotification.id)) {
          return current;
        }

        return [runtimeNotification, ...current].slice(0, 20);
      });

      pushVisualNotification(title, message, tag);
    },
    [mode, pushVisualNotification, userId],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (!hasRealtimeSession || useOrdersFallback) {
      setRealtimeConnected(false);
      return;
    }

    const channelFilter =
      mode === "admin" ? "target_role=eq.admin" : `user_id=eq.${userId}`;

    const channel = supabase
      .channel(`notifications-${mode}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: channelFilter,
        },
        (payload) => {
          const incoming = payload.new as NotificationRow;

          setNotifications((current) => {
            if (current.some((entry) => entry.id === incoming.id)) {
              return current;
            }

            return [incoming, ...current].slice(0, 20);
          });

          pushVisualNotification(incoming.title, incoming.message, incoming.id);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: channelFilter,
        },
        (payload) => {
          const incoming = payload.new as NotificationRow;

          setNotifications((current) => {
            return current.map((entry) => {
              return entry.id === incoming.id ? incoming : entry;
            });
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeConnected(true);
          return;
        }

        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeConnected(false);
          setUseOrdersFallback(true);

          // Attempt to reconnect after a delay instead of staying in fallback mode permanently
          if (reconnectTimerRef.current !== null) {
            window.clearTimeout(reconnectTimerRef.current);
          }
          reconnectTimerRef.current = window.setTimeout(() => {
            reconnectTimerRef.current = null;
            setUseOrdersFallback(false);
          }, 15000);
        }
      });

    return () => {
      setRealtimeConnected(false);
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [hasRealtimeSession, mode, pushVisualNotification, supabase, useOrdersFallback, userId]);

  useEffect(() => {
    if (!hasRealtimeSession || !useOrdersFallback) {
      return;
    }

    const customerFilter = mode === "customer" ? `user_id=eq.${userId}` : undefined;

    const channel = supabase
      .channel(`orders-notification-fallback-${mode}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: customerFilter,
        },
        (payload) => {
          const order = payload.new as OrderRow;
          const code = shortOrderId(order.id);

          if (mode === "admin") {
            pushRuntimeNotification(
              "New order received",
              `Order #${code} needs payment verification and processing.`,
              `fallback-insert-admin-${order.id}`,
            );
            return;
          }

          pushRuntimeNotification(
            "Order placed",
            `Order #${code} has been placed successfully.`,
            `fallback-insert-customer-${order.id}`,
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: customerFilter,
        },
        (payload) => {
          const order = payload.new as OrderRow;
          const code = shortOrderId(order.id);

          if (mode === "admin") {
            pushRuntimeNotification(
              "Order updated",
              `Order #${code} is now ${formatOrderStatus(order.order_status)}.`,
              `fallback-update-admin-${order.id}-${order.order_status}-${order.payment_status}`,
            );
            return;
          }

          pushRuntimeNotification(
            "Order status updated",
            `Order #${code} is ${formatOrderStatus(order.order_status)}. Payment: ${formatOrderStatus(order.payment_status)}.`,
            `fallback-update-customer-${order.id}-${order.order_status}-${order.payment_status}`,
          );
        },
      )
      .subscribe((status) => {
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeConnected(false);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hasRealtimeSession, mode, pushRuntimeNotification, supabase, useOrdersFallback, userId]);

  const fetchLatestNotifications = useCallback(async () => {
    if (!hasRealtimeSession) {
      return;
    }

    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    if (mode === "admin") {
      query = query.eq("target_role", "admin");
    } else {
      query = query.eq("target_role", "customer").eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingNotificationsTableMessage(error.message)) {
        setUseOrdersFallback(true);
        return;
      }

      console.error("[Notifications] Failed to fetch latest notifications:", error.message);
      return;
    }

    setNotifications(data ?? []);
  }, [hasRealtimeSession, mode, supabase, userId]);

  useEffect(() => {
    if (!hasRealtimeSession) {
      return;
    }

    void fetchLatestNotifications();
    const intervalMs = !useOrdersFallback && realtimeConnected ? 12000 : 4500;
    const timer = window.setInterval(() => {
      void fetchLatestNotifications();
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [
    fetchLatestNotifications,
    hasRealtimeSession,
    realtimeConnected,
    useOrdersFallback,
  ]);

  const markAllAsRead = async () => {
    const unreadIds = notifications
      .filter((entry) => !entry.is_read)
      .map((entry) => entry.id);

    if (unreadIds.length === 0) {
      return;
    }

    const previous = notifications;
    setNotifications((current) => current.map((entry) => ({ ...entry, is_read: true })));

    if (useOrdersFallback) {
      return;
    }

    const result = await markNotificationsReadAction(unreadIds);
    if (!result.ok) {
      setNotifications(previous);
      toast.error(result.error);
      return;
    }

    void fetchLatestNotifications();
  };

  const markOneAsRead = async (id: string) => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((entry) => {
        return entry.id === id ? { ...entry, is_read: true } : entry;
      }),
    );

    if (useOrdersFallback) {
      return;
    }

    const result = await markNotificationsReadAction([id]);
    if (!result.ok) {
      setNotifications(previous);
      toast.error(result.error);
      return;
    }

    void fetchLatestNotifications();
  };

  const requestPushPermission = async () => {
    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);

    if (nextPermission === "granted") {
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.ready;
        } catch (error) {
          console.error("[Notifications] Service worker is not ready:", error);
        }
      }
      toast.success("Push notifications enabled");
      return;
    }

    toast.error("Push notifications are blocked in this browser.");
  };

  return (
    <div className={cn("relative", className)} ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
          mode === "admin"
            ? "border-white/20 bg-[#202332] text-zinc-100 hover:bg-[#2a2d3f]"
            : "border-red-100 text-zinc-700 hover:bg-red-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
        )}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? <BellRing size={17} /> : <Bell size={17} />}
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e10600] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-2xl border p-3 shadow-2xl",
            mode === "admin"
              ? "border-white/15 bg-[#161826]"
              : "border-red-100 bg-white dark:border-zinc-700 dark:bg-zinc-900",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <p
              className={cn(
                "text-sm font-bold",
                mode === "admin" ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100",
              )}
            >
              Notifications
            </p>
            <button
              type="button"
              onClick={markAllAsRead}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                mode === "admin" ? "text-red-300 hover:text-red-200" : "text-[#e10600]",
              )}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          </div>

          <div className="mb-3 space-y-2">
            {permission === "granted" ? (
              <p
                className={cn(
                  "text-xs",
                  mode === "admin" ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-300",
                )}
              >
                Browser push notifications are enabled.
              </p>
            ) : permission === "unsupported" ? (
              <p
                className={cn(
                  "text-xs",
                  mode === "admin" ? "text-zinc-400" : "text-zinc-600 dark:text-zinc-300",
                )}
              >
                Push notifications are not supported in this browser.
              </p>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={requestPushPermission}
                className="w-full text-[10px]"
              >
                Enable Push Notifications
              </Button>
            )}

            {useOrdersFallback ? (
              <p
                className={cn(
                  "text-[11px]",
                  mode === "admin" ? "text-amber-300" : "text-amber-700 dark:text-amber-300",
                )}
              >
                Realtime fallback mode is active.
              </p>
            ) : null}
            {!hasRealtimeSession ? (
              <p
                className={cn(
                  "text-[11px]",
                  mode === "admin" ? "text-amber-300" : "text-amber-700 dark:text-amber-300",
                )}
              >
                Connecting realtime session...
              </p>
            ) : null}
          </div>

          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs",
                  mode === "admin"
                    ? "border-white/10 text-zinc-400"
                    : "border-red-100 text-zinc-500 dark:border-zinc-700 dark:text-zinc-300",
                )}
              >
                No notifications yet.
              </p>
            ) : (
              notifications.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  onClick={() => {
                    if (!entry.is_read) {
                      void markOneAsRead(entry.id);
                    }
                  }}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left",
                    mode === "admin"
                      ? "border-white/10 bg-[#202332]"
                      : "border-red-100 bg-red-50/30 dark:border-zinc-700 dark:bg-zinc-800/40",
                    entry.is_read ? "opacity-80" : "opacity-100",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          mode === "admin" ? "text-zinc-100" : "text-zinc-900 dark:text-zinc-100",
                        )}
                      >
                        {entry.title}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          mode === "admin" ? "text-zinc-300" : "text-zinc-600 dark:text-zinc-300",
                        )}
                      >
                        {entry.message}
                      </p>
                    </div>

                    {!entry.is_read ? (
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#e10600]" />
                    ) : null}
                  </div>

                  <p
                    className={cn(
                      "mt-2 text-[11px]",
                      mode === "admin" ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    {formatTimestamp(entry.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
