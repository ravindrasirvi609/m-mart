import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { recordSecurityEvent } from "@/lib/security/audit";
import { detectSuspiciousLogin } from "@/lib/security/auth-monitor";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { getRequestMetadata } from "@/lib/security/request";
import {
  blacklistToken,
  isTokenBlacklisted,
} from "@/lib/security/token-blacklist";
import { normalizeSupabaseCookieOptions } from "@/lib/supabase/proxy";

function getSafeNextPath(nextPath: string | null, fallback = "/") {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));
  const metadata = await getRequestMetadata();
  const limiter = consumeRateLimit({
    key: `auth_callback:${metadata.ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return NextResponse.redirect(
      new URL(
        "/login?error=Too many authentication attempts. Try again shortly.",
        request.url,
      ),
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL("/login?error=Server configuration error", request.url),
    );
  }

  // Use the same cookie pattern as middleware.ts so auth cookies are
  // written directly onto the NextResponse that we return (the redirect).
  // Using cookies() from next/headers does NOT transfer cookies to a
  // NextResponse.redirect(), which causes session loss in production.
  const response = NextResponse.redirect(new URL(nextPath, request.url));
  response.headers.set("Cache-Control", "no-store");

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = normalizeSupabaseCookieOptions(
            request,
            options,
          );

          // Keep request and redirect response cookies synchronized.
          request.cookies.set(name, value);
          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  if (tokenHash && type) {
    const replayed = await isTokenBlacklisted(tokenHash);
    if (replayed) {
      await recordSecurityEvent({
        eventType: "auth_callback_blocked_replay",
        outcome: "blocked",
        riskLevel: "high",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
      return NextResponse.redirect(
        new URL(
          "/login?error=This sign-in link has already been used.",
          request.url,
        ),
      );
    }

    // Attempt OTP verification with one retry for transient failures
    let verifyError: Error | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });
      if (!error) {
        verifyError = null;
        break;
      }
      verifyError = error;
      // Only retry on potentially transient errors, not on invalid/expired tokens
      const message = error.message?.toLowerCase() ?? "";
      const isTransient =
        message.includes("network") ||
        message.includes("timeout") ||
        message.includes("fetch") ||
        message.includes("socket") ||
        message.includes("econnreset");
      if (!isTransient) break;
      // Brief delay before retry
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (verifyError) {
      await recordSecurityEvent({
        eventType: "auth_callback_verify_failed",
        outcome: "failure",
        riskLevel: "medium",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        metadata: {
          reason: "otp_verification_failed",
        },
      });
      return NextResponse.redirect(
        new URL(
          "/login?error=Sign-in link is invalid or expired.",
          request.url,
        ),
      );
    }

    // Only blacklist AFTER successful verification to avoid locking out
    // users when verification fails due to transient errors.
    await blacklistToken(tokenHash, 3600);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      await recordSecurityEvent({
        eventType: "auth_callback_code_exchange_failed",
        outcome: "failure",
        riskLevel: "medium",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        metadata: {
          reason: "code_exchange_failed",
        },
      });
      return NextResponse.redirect(
        new URL(
          "/login?error=Sign-in session could not be created.",
          request.url,
        ),
      );
    }
  } else {
    await recordSecurityEvent({
      eventType: "auth_callback_missing_params",
      outcome: "failure",
      riskLevel: "medium",
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
    return NextResponse.redirect(
      new URL("/login?error=Invalid login link", request.url),
    );
  }

  // Retrieve user with a retry for transient failures (session may take a
  // moment to propagate after OTP verification).
  let user = null;
  let userError = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = await supabase.auth.getUser();
    user = result.data?.user ?? null;
    userError = result.error;
    if (user) break;
    if (attempt === 0) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  if (userError || !user) {
    await recordSecurityEvent({
      eventType: "auth_callback_no_user",
      outcome: "failure",
      riskLevel: "high",
      ip: metadata.ip,
      userAgent: metadata.userAgent,
    });
    return NextResponse.redirect(
      new URL("/login?error=Session creation failed", request.url),
    );
  }

  // Sync user profile — this is non-critical and should never block login.
  // If the upsert fails, the user still has a valid session and can use the app.
  if (user.email) {
    try {
      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name ?? null,
        },
        {
          onConflict: "id",
        },
      );

      if (upsertError) {
        await recordSecurityEvent({
          eventType: "auth_callback_profile_sync_failed",
          outcome: "failure",
          riskLevel: "low",
          ip: metadata.ip,
          userAgent: metadata.userAgent,
          email: user.email,
          userId: user.id,
        });
        // Continue with login — profile sync can be retried later
      }
    } catch {
      // Swallow profile sync errors — login must not be blocked by this
    }
  }

  await recordSecurityEvent({
    eventType: "auth_callback_success",
    outcome: "success",
    riskLevel: "low",
    ip: metadata.ip,
    userAgent: metadata.userAgent,
    email: user.email ?? undefined,
    userId: user.id,
  });

  const suspiciousLogin = detectSuspiciousLogin(user.email ?? "", metadata.ip);
  if (suspiciousLogin) {
    await recordSecurityEvent({
      eventType: "auth_login_suspicious_pattern",
      outcome: "suspicious",
      riskLevel: "high",
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      email: user.email ?? undefined,
      userId: user.id,
      metadata: {
        reason: "multiple_ips_seen_for_account_in_24h",
      },
    });
  }

  return response;
}
