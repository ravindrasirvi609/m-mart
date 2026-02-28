"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  SupabaseClient,
} from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type RealtimeStatus = "connecting" | "connected" | "disconnected";

type TableName = keyof Database["public"]["Tables"];

type RowOf<T extends TableName> = Database["public"]["Tables"][T]["Row"];

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type RealtimePayload<T extends TableName> =
  RealtimePostgresChangesPayload<RowOf<T>>;

type RealtimeHandler<T extends TableName> = (
  payload: RealtimePayload<T>,
) => void;

interface UseRealtimeChannelOptions<T extends TableName> {
  /** Unique channel name — must be unique per component instance */
  channelName: string;
  /** Supabase table to listen on */
  table: T;
  /** Which events to listen for (default: "*") */
  event?: ChangeEvent;
  /** Whether this hook is enabled (e.g., only when user has a session) */
  enabled?: boolean;
  /** Called on every matching change event */
  onPayload: RealtimeHandler<T>;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** How often (ms) to check if the channel is still alive */
const HEARTBEAT_INTERVAL_MS = 30_000;

/** Initial reconnect delay (doubles each failure, capped at 30s) */
const INITIAL_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Grace period (ms) after reconnecting during which the heartbeat
 * won't trigger another reconnect. Prevents reconnect storms.
 */
const RECONNECT_GRACE_MS = 10_000;

/* ------------------------------------------------------------------ */
/*  Event deduplication — global across all hooks                      */
/* ------------------------------------------------------------------ */

const processedEvents = new Set<string>();
const MAX_PROCESSED_EVENTS = 500;

function deduplicateEvent(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
): boolean {
  const newRecord = payload.new as Record<string, unknown> | null;
  const id =
    newRecord && typeof newRecord === "object" && "id" in newRecord
      ? newRecord.id
      : "";
  const eventKey = `${payload.commit_timestamp}:${payload.eventType}:${id}`;

  if (processedEvents.has(eventKey)) {
    return true; // duplicate
  }

  processedEvents.add(eventKey);

  // Keep bounded
  if (processedEvents.size > MAX_PROCESSED_EVENTS) {
    const entries = Array.from(processedEvents);
    processedEvents.clear();
    for (let i = entries.length - 250; i < entries.length; i++) {
      processedEvents.add(entries[i]);
    }
  }

  return false; // not a duplicate
}

/* ------------------------------------------------------------------ */
/*  Transport helper                                                   */
/* ------------------------------------------------------------------ */

/**
 * Ensure the underlying Supabase Realtime WebSocket transport is alive.
 */
function ensureTransportAlive(supabase: SupabaseClient<Database>) {
  try {
    const rt = (
      supabase as unknown as {
        realtime?: {
          conn?: WebSocket | null;
          connect?: () => void;
          isConnected?: () => boolean;
        };
      }
    ).realtime;
    if (!rt) return;

    if (typeof rt.connect === "function") {
      const isConnected =
        typeof rt.isConnected === "function"
          ? rt.isConnected()
          : rt.conn != null && rt.conn.readyState === WebSocket.OPEN;

      if (!isConnected) {
        console.info("[Realtime] 🔌 Transport dead — forcing reconnect");
        rt.connect();
      }
    }
  } catch (err) {
    console.warn("[Realtime] Could not check/reconnect transport:", err);
  }
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * Core Supabase Realtime hook — production-hardened.
 *
 * **No server-side filters** — subscribes to all changes on the table
 * and lets the consumer do client-side filtering. This avoids the
 * REPLICA IDENTITY + RLS issues that cause silent event drops.
 *
 * Features:
 * - Global event deduplication across all hook instances
 * - Reconnect grace period prevents reconnect storms
 * - Heartbeat only reconnects on terminal states (not "joining")
 * - Auth token refresh before subscribing
 * - Visibility + online/offline detection with debounce
 * - Exponential backoff reconnection (2s → 4s → 8s → max 30s)
 * - Proper cleanup on unmount
 * - broadcast.self disabled to prevent echo loops
 */
export function useRealtimeChannel<T extends TableName>({
  channelName,
  table,
  event = "*",
  enabled = true,
  onPayload,
}: UseRealtimeChannelOptions<T>) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [status, setStatus] = useState<RealtimeStatus>("disconnected");
  const [hasSession, setHasSession] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const mountedRef = useRef(true);
  const statusRef = useRef<RealtimeStatus>("disconnected");
  const lastReconnectRef = useRef(0);
  const reconnectCountRef = useRef(0);

  // Keep onPayload ref stable to avoid channel re-creation
  const handlerRef = useRef(onPayload);
  useEffect(() => {
    handlerRef.current = onPayload;
  }, [onPayload]);

  // Keep status ref in sync
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  /* ----- Auth session bootstrap ----- */
  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (mounted) {
          setHasSession(Boolean(data.user) && !error);
        }
      } catch {
        if (mounted) setHasSession(false);
      }
    };

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setHasSession(Boolean(session));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  /* ----- Channel lifecycle ----- */
  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, [supabase]);

  /* ----- Subscribe ----- */
  const subscribeRef = useRef<() => Promise<void>>(async () => {});

  subscribeRef.current = async () => {
    cleanup();

    if (!mountedRef.current) return;

    // Refresh auth token before subscribing
    try {
      await supabase.auth.getSession();
    } catch {
      console.warn("[Realtime] Could not refresh auth session");
    }

    ensureTransportAlive(supabase);

    setStatus("connecting");
    lastReconnectRef.current = Date.now();

    // Unique channel name per reconnect to avoid stale channel reuse
    reconnectCountRef.current += 1;
    const uniqueChannelName = `${channelName}#${reconnectCountRef.current}`;

    const channel = supabase
      .channel(uniqueChannelName, {
        config: { broadcast: { self: false } },
      })
      .on(
        "postgres_changes",
        {
          event,
          schema: "public",
          table,
        },
        (payload) => {
          // Global deduplication
          if (
            deduplicateEvent(
              payload as RealtimePostgresChangesPayload<
                Record<string, unknown>
              >,
            )
          ) {
            return;
          }
          handlerRef.current(payload as RealtimePayload<T>);
        },
      )
      .subscribe((subscriptionStatus, err) => {
        if (!mountedRef.current) return;

        if (subscriptionStatus === "SUBSCRIBED") {
          setStatus("connected");
          backoffRef.current = INITIAL_BACKOFF_MS;
          console.info(
            `[Realtime] ✓ Subscribed to "${channelName}" (table: ${table})`,
          );
          return;
        }

        if (
          subscriptionStatus === "CHANNEL_ERROR" ||
          subscriptionStatus === "TIMED_OUT" ||
          subscriptionStatus === "CLOSED"
        ) {
          setStatus("disconnected");
          const errorMsg =
            err?.message || (err as unknown as string) || "Unknown error";
          console.error(
            `[Realtime] ❌ Channel "${channelName}" failed (${subscriptionStatus}):`,
            errorMsg,
          );
          scheduleReconnect();
        }
      });

    channelRef.current = channel;
  };

  /** Schedule a reconnect with exponential backoff */
  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;

    const delay = backoffRef.current;
    backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS);

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (mountedRef.current) {
        console.info(
          `[Realtime] Reconnecting "${channelName}" (backoff: ${delay}ms)...`,
        );
        void subscribeRef.current();
      }
    }, delay);
  }, [channelName]);

  /** Manual retry */
  const retry = useCallback(() => {
    if (!mountedRef.current) return;
    console.info(`[Realtime] 🔄 Manual retry for "${channelName}"`);
    backoffRef.current = INITIAL_BACKOFF_MS;
    void subscribeRef.current();
  }, [channelName]);

  /* ----- Main subscription effect ----- */
  useEffect(() => {
    mountedRef.current = true;

    if (enabled && hasSession) {
      const env = getPublicEnv();
      console.debug("[Realtime] Connecting:", {
        channelName,
        table,
        url: env.NEXT_PUBLIC_SUPABASE_URL,
      });
      void subscribeRef.current();
    } else {
      cleanup();
      setStatus("disconnected");
    }

    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, hasSession, cleanup, channelName]);

  /* ----- Heartbeat: periodic channel health check ----- */
  useEffect(() => {
    if (!enabled || !hasSession) return;

    heartbeatTimerRef.current = setInterval(() => {
      if (!mountedRef.current || !enabled) return;

      // Don't reconnect during grace period
      if (Date.now() - lastReconnectRef.current < RECONNECT_GRACE_MS) {
        return;
      }

      const channel = channelRef.current;
      if (!channel) {
        if (statusRef.current !== "connecting") {
          console.info(
            `[Realtime] 💓 Heartbeat: no channel for "${channelName}", reconnecting...`,
          );
          backoffRef.current = INITIAL_BACKOFF_MS;
          void subscribeRef.current();
        }
        return;
      }

      const state = (channel as unknown as { state?: string }).state;
      // Only reconnect on terminal states, NOT "joining" (transient)
      if (state && state !== "joined" && state !== "joining") {
        console.info(
          `[Realtime] 💓 Heartbeat: channel "${channelName}" in state "${state}", reconnecting...`,
        );
        setStatus("disconnected");
        backoffRef.current = INITIAL_BACKOFF_MS;
        void subscribeRef.current();
      }
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [enabled, hasSession, channelName]);

  /* ----- Visibility change: reconnect when tab regains focus ----- */
  useEffect(() => {
    if (!enabled || !hasSession) return;

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (!mountedRef.current) return;

      // Don't reconnect if recent
      if (Date.now() - lastReconnectRef.current < RECONNECT_GRACE_MS) {
        return;
      }

      const channel = channelRef.current;
      const state = channel
        ? (channel as unknown as { state?: string }).state
        : null;

      if (!channel || (state && state !== "joined" && state !== "joining")) {
        console.info(
          `[Realtime] 👁 Tab visible: channel "${channelName}" stale (state: ${state ?? "null"}), reconnecting...`,
        );
        setStatus("disconnected");
        backoffRef.current = INITIAL_BACKOFF_MS;
        void subscribeRef.current();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [enabled, hasSession, channelName]);

  /* ----- Online/offline: reconnect when network comes back ----- */
  useEffect(() => {
    if (!enabled || !hasSession) return;

    const onOnline = () => {
      if (!mountedRef.current) return;

      // Debounce rapid network flapping
      if (Date.now() - lastReconnectRef.current < RECONNECT_GRACE_MS) {
        return;
      }

      console.info(
        `[Realtime] 🌐 Network online: reconnecting "${channelName}"...`,
      );
      backoffRef.current = INITIAL_BACKOFF_MS;
      void subscribeRef.current();
    };

    const onOffline = () => {
      if (!mountedRef.current) return;
      console.info(
        `[Realtime] 📴 Network offline: marking "${channelName}" disconnected`,
      );
      setStatus("disconnected");
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [enabled, hasSession, channelName]);

  return { status, hasSession, retry };
}
