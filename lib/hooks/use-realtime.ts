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
const HEARTBEAT_INTERVAL_MS = 25_000;

/** Initial reconnect delay (doubles each failure, capped at 30s) */
const INITIAL_BACKOFF_MS = 2_000;
const MAX_BACKOFF_MS = 30_000;

/* ------------------------------------------------------------------ */
/*  Transport helper                                                   */
/* ------------------------------------------------------------------ */

/**
 * Ensure the underlying Supabase Realtime WebSocket transport is alive.
 *
 * When `removeChannel` removes the last channel, Supabase internally
 * calls `disconnect()` on the RealtimeClient — killing the WebSocket.
 * Subsequent `channel().subscribe()` calls silently fail because the
 * transport never re-opens.
 *
 * This helper detects that state and forces a fresh `connect()`.
 */
function ensureTransportAlive(supabase: SupabaseClient<Database>) {
    try {
        const rt = (supabase as unknown as { realtime?: { conn?: WebSocket | null; connect?: () => void; isConnected?: () => boolean } }).realtime;
        if (!rt) return;

        // If there's a connect method and no active connection, force-connect
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
 * Core Supabase Realtime hook.
 *
 * **No server-side filters** — subscribes to all changes on the table
 * and lets the consumer do client-side filtering. This avoids the
 * REPLICA IDENTITY + RLS issues that cause silent event drops.
 *
 * Features:
 * - Bootstraps auth session before subscribing
 * - Exponential backoff reconnection (2s → 4s → 8s → max 30s)
 * - **Visibility-based reconnection** — reconnects when tab regains focus
 * - **Heartbeat keep-alive** — detects stale connections every 25s
 * - **Online/offline detection** — reconnects when network comes back
 * - Auth token refresh before reconnecting
 * - Transport-level reconnection when underlying WebSocket dies
 * - Unique channel names per reconnect to avoid stale channel reuse
 * - Manual retry callback for user-initiated reconnection
 * - Reports connection status
 * - Cleans up channel on unmount
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

    /* ----- Subscribe (stored in ref to break circular dependency) ----- */

    /**
     * We store `subscribe` in a ref so that `scheduleReconnect` always
     * calls the **latest** version. This breaks the circular
     * useCallback dependency that caused stale closures.
     */
    const subscribeRef = useRef<() => Promise<void>>(async () => { });

    subscribeRef.current = async () => {
        // Clean up any previous channel
        cleanup();

        if (!mountedRef.current) return;

        // Refresh auth token before subscribing to prevent JWT expiry failures
        try {
            await supabase.auth.getSession();
        } catch {
            console.warn("[Realtime] Could not refresh auth session before subscribing");
        }

        // Force transport reconnection if the underlying WebSocket is dead
        ensureTransportAlive(supabase);

        setStatus("connecting");

        // Increment reconnect counter for a unique channel name.
        // Supabase caches channels by topic name — reusing the same name
        // can return a stale/dead channel object.
        reconnectCountRef.current += 1;
        const uniqueChannelName = `${channelName}#${reconnectCountRef.current}`;

        const channel = supabase
            .channel(uniqueChannelName, {
                config: { broadcast: { self: true } },
            })
            .on(
                "postgres_changes",
                {
                    event,
                    schema: "public",
                    table,
                },
                (payload) => {
                    handlerRef.current(payload as RealtimePayload<T>);
                },
            )
            .subscribe((subscriptionStatus, err) => {
                if (!mountedRef.current) return;

                if (subscriptionStatus === "SUBSCRIBED") {
                    setStatus("connected");
                    backoffRef.current = INITIAL_BACKOFF_MS; // Reset backoff on success
                    console.info(`[Realtime] ✓ Subscribed to "${uniqueChannelName}"`);
                    return;
                }

                if (
                    subscriptionStatus === "CHANNEL_ERROR" ||
                    subscriptionStatus === "TIMED_OUT" ||
                    subscriptionStatus === "CLOSED"
                ) {
                    setStatus("disconnected");
                    const errorMsg = err?.message || (err as unknown as string) || "Unknown error";
                    console.error(
                        `[Realtime] ❌ Channel "${uniqueChannelName}" failed (${subscriptionStatus}):`,
                        errorMsg,
                    );

                    if (errorMsg.includes("JWT")) {
                        console.error("[Realtime] Hint: Your authentication token might be invalid or expired.");
                    }
                    if (errorMsg.includes("API key")) {
                        console.error("[Realtime] Hint: Your NEXT_PUBLIC_SUPABASE_ANON_KEY might be incorrect.");
                    }

                    // Exponential backoff reconnection
                    scheduleReconnect();
                }
            });

        channelRef.current = channel;
    };

    /** Schedule a reconnect with exponential backoff */
    const scheduleReconnect = useCallback(() => {
        // Don't schedule if one is already pending
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

    /** Manual retry — exposed to consumers for a "Retry" button */
    const retry = useCallback(() => {
        if (!mountedRef.current) return;
        console.info(`[Realtime] 🔄 Manual retry for "${channelName}"`);
        backoffRef.current = INITIAL_BACKOFF_MS;
        void subscribeRef.current();
    }, [channelName]);

    /* ----- Main subscription effect ----- */
    useEffect(() => {
        mountedRef.current = true;

        const env = getPublicEnv();
        console.debug("[Realtime] Status Check:", {
            enabled,
            hasSession,
            url: env.NEXT_PUBLIC_SUPABASE_URL,
            keyPrefix: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10),
            channelName,
        });

        if (enabled && hasSession) {
            void subscribeRef.current();
        } else {
            cleanup();
            setStatus("disconnected");
            if (!hasSession && enabled) {
                console.info(`[Realtime] ⏸ Waiting for auth session before connecting to "${channelName}"...`);
            }
        }

        return () => {
            mountedRef.current = false;
            cleanup();
        };
        // subscribeRef is a ref — no need to include it in deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, hasSession, cleanup, channelName]);

    /* ----- Heartbeat: periodic channel health check ----- */
    useEffect(() => {
        if (!enabled || !hasSession) return;

        heartbeatTimerRef.current = setInterval(() => {
            if (!mountedRef.current || !enabled) return;

            const channel = channelRef.current;
            if (!channel) {
                // Channel is gone — try to reconnect
                if (statusRef.current !== "connecting") {
                    console.info(`[Realtime] 💓 Heartbeat: no channel found for "${channelName}", reconnecting...`);
                    backoffRef.current = INITIAL_BACKOFF_MS;
                    void subscribeRef.current();
                }
                return;
            }

            // Check the internal Supabase channel state
            // RealtimeChannel exposes a `.state` getter: "joined" | "joining" | "leaving" | "closed" | "errored"
            const state = (channel as unknown as { state?: string }).state;
            if (state && state !== "joined" && state !== "joining") {
                console.info(`[Realtime] 💓 Heartbeat: channel "${channelName}" in state "${state}", reconnecting...`);
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, hasSession, channelName]);

    /* ----- Visibility change: reconnect when tab regains focus ----- */
    useEffect(() => {
        if (!enabled || !hasSession) return;

        const onVisibilityChange = () => {
            if (document.visibilityState !== "visible") return;
            if (!mountedRef.current) return;

            // Tab just became visible — check if connection is still alive
            const channel = channelRef.current;
            const state = channel
                ? (channel as unknown as { state?: string }).state
                : null;

            if (!channel || (state && state !== "joined")) {
                console.info(
                    `[Realtime] 👁 Tab visible: channel "${channelName}" is stale (state: ${state ?? "null"}), reconnecting...`,
                );
                setStatus("disconnected");
                backoffRef.current = INITIAL_BACKOFF_MS; // Reset backoff for quick reconnect
                void subscribeRef.current();
            } else {
                console.debug(`[Realtime] 👁 Tab visible: channel "${channelName}" still alive`);
            }
        };

        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, hasSession, channelName]);

    /* ----- Online/offline: reconnect when network comes back ----- */
    useEffect(() => {
        if (!enabled || !hasSession) return;

        const onOnline = () => {
            if (!mountedRef.current) return;
            console.info(`[Realtime] 🌐 Network online: reconnecting "${channelName}"...`);
            backoffRef.current = INITIAL_BACKOFF_MS;
            void subscribeRef.current();
        };

        const onOffline = () => {
            if (!mountedRef.current) return;
            console.info(`[Realtime] 📴 Network offline: marking "${channelName}" disconnected`);
            setStatus("disconnected");
        };

        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, hasSession, channelName]);

    return { status, hasSession, retry };
}
