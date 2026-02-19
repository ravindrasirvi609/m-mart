"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getPublicEnv } from "@/lib/env";
import { isNativeApp } from "@/lib/mobile/capacitor";
import { createSupabaseAuthStorage } from "@/lib/mobile/supabase-storage";
import type { Database } from "@/lib/supabase/types";

let browserClient: SupabaseClient<Database> | undefined;

export function createBrowserSupabaseClient() {
  if (!browserClient) {
    const env = getPublicEnv();
    const nativeRuntime = isNativeApp();

    browserClient = createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          storageKey: "mmart.auth.token",
          persistSession: true,
          detectSessionInUrl: true,
          flowType: "pkce",
          ...(nativeRuntime ? { storage: createSupabaseAuthStorage() } : {}),
        },
      },
    );
  }

  return browserClient;
}
