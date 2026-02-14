import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextPath = requestUrl.searchParams.get("next") ?? "/";

  const supabase = await createServerSupabaseClient();

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

  // Ensure internal redirect for better reliability
  return NextResponse.redirect(new URL(nextPath, request.url));
}
