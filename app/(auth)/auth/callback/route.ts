import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = requestUrl.searchParams.get("next") ?? "/";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login?error=Server configuration error", request.url));
  }

  // Use the same cookie pattern as middleware.ts so auth cookies are
  // written directly onto the NextResponse that we return (the redirect).
  // Using cookies() from next/headers does NOT transfer cookies to a
  // NextResponse.redirect(), which causes session loss in production.
  let response = NextResponse.redirect(new URL(nextPath, request.url));

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // In production, ensure cookies are valid for both apex and subdomains
          const cookieOptions = { ...options };
          if (request.headers.get("host")?.includes("mmart4u.com")) {
            cookieOptions.domain = ".mmart4u.com";
          }

          request.cookies.set(name, value);
          response.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    if (error) {
      console.error("Auth callback OTP error:", error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Auth callback code error:", error.message);
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
    }
  } else {
    console.error("Auth callback error: No token_hash or code provided");
    return NextResponse.redirect(new URL("/login?error=Invalid login link", request.url));
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Auth callback user error:", userError?.message ?? "No user found");
    return NextResponse.redirect(new URL("/login?error=Session creation failed", request.url));
  }

  if (user.email) {
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
    });
  }

  return response;
}
