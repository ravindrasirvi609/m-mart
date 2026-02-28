import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SHARED_PRODUCTION_COOKIE_DOMAIN = ".mmart4u.com";
const SECURITY_HEADERS: Record<string, string> = {
  "X-DNS-Prefetch-Control": "off",
  "X-Download-Options": "noopen",
  "X-Permitted-Cross-Domain-Policies": "none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-site",
};

function shouldScopeCookiesToSharedDomain(request: NextRequest) {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const hostname = request.nextUrl.hostname.toLowerCase();
  return (
    hostname === "mmart4u.com" ||
    hostname === "www.mmart4u.com" ||
    hostname.endsWith(".mmart4u.com")
  );
}

export function normalizeSupabaseCookieOptions(
  request: NextRequest,
  options: CookieOptions = {},
): CookieOptions {
  const normalizedOptions: CookieOptions = { ...options };

  if (shouldScopeCookiesToSharedDomain(request)) {
    normalizedOptions.domain = SHARED_PRODUCTION_COOKIE_DOMAIN;
  }

  // IMPORTANT: Do NOT set httpOnly to true. The @supabase/ssr browser client
  // needs to read auth cookies via document.cookie to attach the JWT on
  // client-side requests (RPC calls, realtime, etc.). Setting httpOnly would
  // make all browser-side Supabase calls unauthenticated (auth.uid() → NULL).
  normalizedOptions.httpOnly = false;
  normalizedOptions.secure = process.env.NODE_ENV === "production";
  normalizedOptions.sameSite = "lax";
  normalizedOptions.path = "/";

  return normalizedOptions;
}

function applySecurityHeaders(response: NextResponse) {
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          const cookieOptions = normalizeSupabaseCookieOptions(request, options);

          // Keep request and response cookies synchronized for the current request lifecycle.
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  // IMPORTANT: Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to
  // debug issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  // Refreshing the auth token is critical to keep the session alive.
  await supabase.auth.getUser();

  // IMPORTANT: You *must* return the supabaseResponse object as is.
  // If you create a new response object with NextResponse.next(), make sure
  // to:
  //   1. Pass the request in it:  NextResponse.next({ request })
  //   2. Copy cookies over:       myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  //   3. Return the new response
  // If this is not done, the browser and server go out of sync and the
  // user's session can be terminated prematurely.

  applySecurityHeaders(supabaseResponse);
  return supabaseResponse;
}
