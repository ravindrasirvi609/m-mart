import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/types";
import { normalizeSupabaseCookieOptions } from "@/lib/supabase/proxy";

function createLogoutSupabaseClient(request: NextRequest, response: NextResponse) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = normalizeSupabaseCookieOptions(request, options);

          request.cookies.set(name, value);
          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });
}

// Never sign out on GET; this route can be fetched by prefetchers or bots.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/login", request.url));
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));
  const supabase = createLogoutSupabaseClient(request, response);

  if (supabase) {
    await supabase.auth.signOut();
  }

  response.headers.set("Cache-Control", "no-store");
  return response;
}
