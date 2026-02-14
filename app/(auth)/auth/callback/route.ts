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
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
  } else if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name ?? null,
    });
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
