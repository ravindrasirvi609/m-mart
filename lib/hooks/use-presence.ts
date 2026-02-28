"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/**
 * How often (ms) to send a heartbeat to the server.
 * The server TTL is 120s, so sending every 45s gives ample margin.
 */
const HEARTBEAT_INTERVAL_MS = 45_000;

/**
 * Grace period (ms) before sending offline signal on visibility change.
 * This prevents brief tab switches from triggering offline state.
 */
const OFFLINE_GRACE_MS = 30_000;

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

/**
 * `usePresence` — Server-side presence tracking with heartbeat.
 *
 * How it works:
 * 1. On mount, sends a heartbeat to mark the user online.
 * 2. Sends periodic heartbeats every 45 seconds.
 * 3. On tab hide, starts a grace timer. If the tab stays hidden for
 *    30s, sends an offline signal.
 * 4. On tab show, cancels the grace timer and sends a heartbeat.
 * 5. On network offline, sends offline signal.
 * 6. On network online, sends heartbeat.
 * 7. On unmount (or beforeunload), sends offline signal.
 *
 * The server also has a TTL expiration function (`presence_expire_stale`)
 * that marks users offline if no heartbeat is received in 120s,
 * acting as a safety net for browser crashes or force-closes.
 */
export function usePresence(enabled: boolean = true) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const offlineGraceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const mountedRef = useRef(true);

  /* ----- Core heartbeat ----- */
  const sendHeartbeat = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const pagePath =
        typeof window !== "undefined" ? window.location.pathname : null;

      await supabase.rpc("presence_heartbeat", {
        p_page_path: pagePath ?? undefined,
      });
    } catch {
      // Silently ignore — don't break the app for presence failures
    }
  }, [supabase]);

  /* ----- Send offline signal ----- */
  const sendOffline = useCallback(async () => {
    try {
      await supabase.rpc("presence_offline");
    } catch {
      // Silently ignore
    }
  }, [supabase]);

  /* ----- Lifecycle ----- */
  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;

    // Initial heartbeat
    void sendHeartbeat();

    // Periodic heartbeat
    heartbeatTimerRef.current = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_INTERVAL_MS);

    // Visibility change handler
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Tab visible again — cancel grace timer and heartbeat
        if (offlineGraceTimerRef.current) {
          clearTimeout(offlineGraceTimerRef.current);
          offlineGraceTimerRef.current = null;
        }
        void sendHeartbeat();
      } else {
        // Tab hidden — start grace timer
        offlineGraceTimerRef.current = setTimeout(() => {
          void sendOffline();
        }, OFFLINE_GRACE_MS);
      }
    };

    // Network change handlers
    const onOnline = () => {
      void sendHeartbeat();
    };

    const onOffline = () => {
      // Mark offline on network loss (no grace — network is truly gone)
      void sendOffline();
    };

    // Before unload — let the TTL expire (120s) since sendBeacon
    // can't easily call Supabase RPC. The server TTL handles this.
    const onBeforeUnload = () => {
      // No-op: rely on server-side TTL expiration (120s)
      // for reliable cleanup on tab close / browser crash.
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      mountedRef.current = false;

      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      if (offlineGraceTimerRef.current) {
        clearTimeout(offlineGraceTimerRef.current);
        offlineGraceTimerRef.current = null;
      }

      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeunload", onBeforeUnload);

      // Send offline signal on cleanup
      void sendOffline();
    };
  }, [enabled, sendHeartbeat, sendOffline]);
}
