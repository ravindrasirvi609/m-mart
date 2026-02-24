import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { recordSecurityEvent } from "@/lib/security/audit";
import { SecurityError } from "@/lib/security/errors";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { assertTrustedRequestOrigin, getRequestMetadata } from "@/lib/security/request";
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
  const metadata = await getRequestMetadata();
  const limiter = consumeRateLimit({
    key: `logout:${metadata.ip}`,
    limit: 20,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    const response = NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
    response.headers.set("Retry-After", String(limiter.retryAfterSeconds));
    return response;
  }

  try {
    await assertTrustedRequestOrigin();
  } catch (error) {
    if (error instanceof SecurityError) {
      await recordSecurityEvent({
        eventType: "auth_logout_blocked",
        outcome: "blocked",
        riskLevel: "high",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        metadata: {
          reason: error.message,
        },
      });
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }

    throw error;
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  const supabase = createLogoutSupabaseClient(request, response);

  if (supabase) {
    await supabase.auth.signOut();
  }

  response.headers.set("Cache-Control", "no-store");

  await recordSecurityEvent({
    eventType: "auth_logout",
    outcome: "success",
    riskLevel: "low",
    ip: metadata.ip,
    userAgent: metadata.userAgent,
  });

  return response;
}
