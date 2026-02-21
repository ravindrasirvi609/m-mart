"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
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
    const backoffRef = useRef(2000);
    const mountedRef = useRef(true);

    // Keep onPayload ref stable to avoid channel re-creation
    const handlerRef = useRef(onPayload);
    useEffect(() => {
        handlerRef.current = onPayload;
    }, [onPayload]);

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
        if (channelRef.current) {
            void supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }
    }, [supabase]);

    const subscribe = useCallback(() => {
        // Clean up any previous channel
        cleanup();

        if (!mountedRef.current) return;

        setStatus("connecting");

        const channel = supabase
            .channel(channelName, {
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
                    backoffRef.current = 2000; // Reset backoff on success
                    console.info(`[Realtime] ✓ Subscribed to "${channelName}"`);
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
                        `[Realtime] ❌ Channel "${channelName}" failed (${subscriptionStatus}):`,
                        errorMsg,
                    );

                    if (errorMsg.includes("JWT")) {
                        console.error("[Realtime] Hint: Your authentication token might be invalid or expired.");
                    }
                    if (errorMsg.includes("API key")) {
                        console.error("[Realtime] Hint: Your NEXT_PUBLIC_SUPABASE_ANON_KEY might be incorrect.");
                    }

                    // Exponential backoff reconnection
                    const delay = backoffRef.current;
                    backoffRef.current = Math.min(delay * 2, 30000);

                    reconnectTimerRef.current = setTimeout(() => {
                        reconnectTimerRef.current = null;
                        if (mountedRef.current) {
                            console.info(
                                `[Realtime] Reconnecting "${channelName}" (backoff: ${delay}ms)...`,
                            );
                            subscribe();
                        }
                    }, delay);
                }
            });

        channelRef.current = channel;
    }, [channelName, cleanup, event, supabase, table]);

    useEffect(() => {
        mountedRef.current = true;

        console.debug("[Realtime] Status Check:", {
            enabled,
            hasSession,
            url: env.NEXT_PUBLIC_SUPABASE_URL,
            keyPrefix: env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10),
            channelName,
        });

        if (enabled && hasSession) {
            subscribe();
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
    }, [enabled, hasSession, subscribe, cleanup, channelName]);

    return { status, hasSession };
}

import { getPublicEnv } from "@/lib/env";
const env = getPublicEnv();

