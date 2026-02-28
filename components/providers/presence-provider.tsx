"use client";

import { useEffect, useState } from "react";

import { usePresence } from "@/lib/hooks/use-presence";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

/**
 * PresenceProvider — Wraps the app to provide presence tracking.
 * Only activates when the user is authenticated.
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Presence heartbeat — only when authenticated
  usePresence(hasSession);

  return <>{children}</>;
}
