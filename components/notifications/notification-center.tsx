"use client";

import { Bell, BellRing, CheckCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { markNotificationsReadAction } from "@/actions/notification-actions";
import { Button } from "@/components/ui/button";
import { RealtimeStatusDot } from "@/components/ui/realtime-status";
import { usePushNotifications } from "@/lib/hooks/use-push-notifications";
import { useRealtimeChannel } from "@/lib/hooks/use-realtime";
import type { RealtimePayload } from "@/lib/hooks/use-realtime";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type NotificationCenterProps = {
  mode: "admin" | "customer";
  userId: string;
  initialNotifications: NotificationRow[];
  notificationsAvailable: boolean;
  className?: string;
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NotificationCenter({
  mode,
  userId,
  initialNotifications,
  notificationsAvailable,
  className,
}: NotificationCenterProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const panelRef = useRef<HTMLDivElement>(null);

  // Sync initialNotifications from server on revalidation
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const { permission, requestPermission, sendPush } = usePushNotifications();

  const unreadCount = notifications.reduce(
    (count, n) => count + (n.is_read ? 0 : 1),
    0,
  );

  /* ----- Client-side filter: only show notifications for this user/role ----- */
  const isRelevantNotification = useCallback(
    (row: NotificationRow): boolean => {
      if (mode === "admin") {
        return row.target_role === "admin";
      }
      return row.target_role === "customer" && row.user_id === userId;
    },
    [mode, userId],
  );

  /* ----- Realtime: listen for new notifications (NO server-side filter) ----- */
  const handleNotificationChange = useCallback(
    (payload: RealtimePayload<"notifications">) => {
      if (payload.eventType === "INSERT") {
        const incoming = payload.new as NotificationRow;

        // Client-side filter
        if (!isRelevantNotification(incoming)) return;

        setNotifications((current) => {
          if (current.some((n) => n.id === incoming.id)) return current;
          return [incoming, ...current].slice(0, 20);
        });

        // Toast + push
        toast(incoming.title, { description: incoming.message });
        void sendPush(incoming.title, incoming.message, {
          tag: `notif-${incoming.id}`,
          url: mode === "admin" ? "/admin/orders" : "/orders",
        });
      }

      if (payload.eventType === "UPDATE") {
        const incoming = payload.new as NotificationRow;
        if (!isRelevantNotification(incoming)) return;

        setNotifications((current) =>
          current.map((n) => (n.id === incoming.id ? incoming : n)),
        );
      }
    },
    [isRelevantNotification, mode, sendPush],
  );

  const { status: realtimeStatus, retry: realtimeRetry } = useRealtimeChannel({
    channelName: `notif-center-${mode}-${userId}`,
    table: "notifications",
    event: "*",
    enabled: notificationsAvailable,
    onPayload: handleNotificationChange,
  });

  /* ----- Polling backup: simple 30s fetch ----- */
  const fetchLatest = useCallback(async () => {
    try {
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
        console.error("[NotificationCenter] Poll failed:", error.message);
        return;
      }
      setNotifications(data ?? []);
    } catch {
      // Silently ignore polling failures
    }
  }, [mode, supabase, userId]);

  /* ----- Polling backup: adaptive interval ----- */
  /* Poll every 10s when realtime is disconnected, 30s when connected */
  useEffect(() => {
    // Initial fetch after short delay
    const kickoff = setTimeout(() => void fetchLatest(), 1500);

    const pollInterval = realtimeStatus === "connected" ? 30000 : 10000;
    const timer = setInterval(() => void fetchLatest(), pollInterval);

    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [fetchLatest, realtimeStatus]);

  /* ----- Click outside to close ----- */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ----- Mark as read ----- */
  const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const previous = notifications;
    setNotifications((current) =>
      current.map((n) => ({ ...n, is_read: true })),
    );

    const result = await markNotificationsReadAction(unreadIds);
    if (!result.ok) {
      setNotifications(previous);
      toast.error(result.error);
    }
  };

  const markOneAsRead = async (id: string) => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );

    const result = await markNotificationsReadAction([id]);
    if (!result.ok) {
      setNotifications(previous);
      toast.error(result.error);
    }
  };

  /* ----- Render ----- */
  return (
    <div className={cn("relative", className)} ref={panelRef}>
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
          mode === "admin"
            ? "border-white/20 bg-[#202332] text-zinc-100 hover:bg-[#2a2d3f]"
            : "border-red-100 text-zinc-700 hover:bg-red-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800",
        )}
        aria-label="Notifications"
      >
        {unreadCount > 0 ? <BellRing size={17} /> : <Bell size={17} />}
        {mounted && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#e10600] px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            "absolute right-0 z-50 mt-2 w-[min(92vw,360px)] rounded-2xl border p-3 shadow-2xl",
            mode === "admin"
              ? "border-white/15 bg-[#161826]"
              : "border-red-100 bg-white dark:border-zinc-700 dark:bg-zinc-900",
          )}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-sm font-bold",
                  mode === "admin"
                    ? "text-zinc-100"
                    : "text-zinc-900 dark:text-zinc-100",
                )}
              >
                Notifications
              </p>
              {mounted && (
                <RealtimeStatusDot
                  status={realtimeStatus}
                  onRetry={realtimeRetry}
                  className={
                    mode === "admin"
                      ? "text-zinc-400"
                      : "text-zinc-500 dark:text-zinc-400"
                  }
                />
              )}
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className={cn(
                "inline-flex items-center gap-1 text-xs font-semibold",
                mode === "admin"
                  ? "text-red-300 hover:text-red-200"
                  : "text-[#e10600]",
              )}
            >
              <CheckCheck size={14} />
              Mark all read
            </button>
          </div>

          {/* Push permission banner - mounted guard for hydration safety */}
          {mounted && (
            <div className="mb-3 space-y-2">
              {permission === "granted" ? (
                <p
                  className={cn(
                    "text-xs",
                    mode === "admin"
                      ? "text-zinc-400"
                      : "text-zinc-600 dark:text-zinc-300",
                  )}
                >
                  ✓ Browser push notifications enabled.
                </p>
              ) : permission === "unsupported" ? (
                <p
                  className={cn(
                    "text-xs",
                    mode === "admin"
                      ? "text-zinc-400"
                      : "text-zinc-600 dark:text-zinc-300",
                  )}
                >
                  Push notifications not supported in this browser.
                </p>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void requestPermission()}
                  className="w-full text-[10px]"
                >
                  🔔 Enable Push Notifications
                </Button>
              )}
            </div>
          )}

          {/* Offline Debug Hint */}
          {mounted && realtimeStatus === "disconnected" && (
            <p className="mb-2 text-[9px] text-amber-600 dark:text-amber-400 text-center animate-pulse">
              Realtime Offline. Polling active every 30s.
            </p>
          )}

          {/* Notification list */}
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
                    if (!entry.is_read) void markOneAsRead(entry.id);
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
                          mode === "admin"
                            ? "text-zinc-100"
                            : "text-zinc-900 dark:text-zinc-100",
                        )}
                      >
                        {entry.title}
                      </p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          mode === "admin"
                            ? "text-zinc-300"
                            : "text-zinc-600 dark:text-zinc-300",
                        )}
                      >
                        {entry.message}
                      </p>
                    </div>
                    {!entry.is_read && (
                      <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#e10600]" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "mt-2 text-[11px]",
                      mode === "admin"
                        ? "text-zinc-400"
                        : "text-zinc-500 dark:text-zinc-400",
                    )}
                  >
                    {formatTimestamp(entry.created_at)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

