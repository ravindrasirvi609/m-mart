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
      nativeRuntime
        ? {
          auth: {
            storage: createSupabaseAuthStorage(),
          },
        }
        : {},
    );
  }

  return browserClient;
}
