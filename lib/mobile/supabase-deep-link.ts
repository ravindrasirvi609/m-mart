import type { EmailOtpType } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const AUTH_DEEP_LINK_HOST = "auth";
const AUTH_DEEP_LINK_SCHEME = (process.env.NEXT_PUBLIC_DEEP_LINK_SCHEME ?? "mmart").toLowerCase();

type AuthDeepLinkResult =
  | { handled: false }
  | { handled: true; nextPath?: string; error?: string };

const consumedTokenHashes = new Map<string, number>();

function cleanupConsumedTokenHashes() {
  const now = Date.now();
  for (const [tokenHash, expiresAt] of consumedTokenHashes.entries()) {
    if (expiresAt <= now) {
      consumedTokenHashes.delete(tokenHash);
    }
  }
}

function getSafeNextPath(nextPath: string | null, fallback = "/") {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

function isAppDeepLinkProtocol(protocol: string) {
  return (
    protocol === `${AUTH_DEEP_LINK_SCHEME}:` ||
    protocol === "mmart:" ||
    protocol === "com.mmart.store:"
  );
}

export async function handleSupabaseAuthDeepLink(url: string): Promise<AuthDeepLinkResult> {
  try {
    const parsed = new URL(url);
    if (!isAppDeepLinkProtocol(parsed.protocol) || parsed.host !== AUTH_DEEP_LINK_HOST) {
      return { handled: false };
    }

    const supabase = createBrowserSupabaseClient();
    const code = parsed.searchParams.get("code");

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return { handled: true, error: error.message };
      }
    } else {
      const tokenHash = parsed.searchParams.get("token_hash");
      const type = parsed.searchParams.get("type");

      if (!tokenHash || !type) {
        return { handled: true, error: "Missing auth callback parameters." };
      }

      cleanupConsumedTokenHashes();
      const replayed = consumedTokenHashes.has(tokenHash);
      if (replayed) {
        return { handled: true, error: "This sign-in link has already been used." };
      }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as EmailOtpType,
      });
      if (error) {
        consumedTokenHashes.set(tokenHash, Date.now() + 60 * 60 * 1000);
        return { handled: true, error: error.message };
      }

      consumedTokenHashes.set(tokenHash, Date.now() + 60 * 60 * 1000);
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      return { handled: true, error: sessionError.message };
    }

    if (!session) {
      return { handled: true, error: "Session could not be restored in app." };
    }

    return { handled: true, nextPath: getSafeNextPath(parsed.searchParams.get("next")) };
  } catch {
    return { handled: false };
  }
}
