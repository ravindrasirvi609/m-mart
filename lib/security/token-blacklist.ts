import "server-only";

import { createHash } from "crypto";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/security/logger";

const blacklistedTokenHashes = new Map<string, number>();

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cleanupExpired(now: number) {
  for (const [hash, expiresAt] of blacklistedTokenHashes.entries()) {
    if (expiresAt <= now) {
      blacklistedTokenHashes.delete(hash);
    }
  }
}

async function persistTokenHash(hash: string, expiresAtIso: string) {
  const admin = createAdminSupabaseClient() as unknown as {
    from: (table: string) => {
      upsert: (
        payload: Record<string, unknown>,
        options?: Record<string, unknown>,
      ) => Promise<{ error: { code?: string; message: string } | null }>;
    };
  };

  try {
    const { error } = await admin
      .from("revoked_refresh_tokens")
      .upsert(
        {
          token_hash: hash,
          revoked_reason: "replayed_or_consumed_magic_link",
          expires_at: expiresAtIso,
        },
        { onConflict: "token_hash" },
      );

    if (!error) {
      return;
    }

    const message = (error.message ?? "").toLowerCase();
    const missingTable =
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      message.includes("revoked_refresh_tokens") ||
      message.includes("relation");

    if (!missingTable) {
      logger.warn("[TokenBlacklist] Failed to persist revoked token hash:", error.message);
    }
  } catch (error) {
    logger.warn("[TokenBlacklist] Unexpected persistence failure:", error);
  }
}

async function lookupTokenHash(hash: string) {
  const admin = createAdminSupabaseClient() as unknown as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (field: string, value: string) => {
          maybeSingle: () => Promise<{
            data: { expires_at: string | null } | null;
            error: { code?: string; message: string } | null;
          }>;
        };
      };
    };
  };

  try {
    const { data, error } = await admin
      .from("revoked_refresh_tokens")
      .select("expires_at")
      .eq("token_hash", hash)
      .maybeSingle();

    if (error) {
      const message = (error.message ?? "").toLowerCase();
      const missingTable =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        message.includes("revoked_refresh_tokens") ||
        message.includes("relation");

      if (!missingTable) {
        logger.warn("[TokenBlacklist] Failed to lookup token hash:", error.message);
      }

      return false;
    }

    if (!data?.expires_at) {
      return Boolean(data);
    }

    return new Date(data.expires_at).getTime() > Date.now();
  } catch (error) {
    logger.warn("[TokenBlacklist] Unexpected lookup failure:", error);
    return false;
  }
}

export async function blacklistToken(token: string, ttlSeconds = 3600) {
  const now = Date.now();
  cleanupExpired(now);

  const hash = sha256(token);
  const expiresAt = now + ttlSeconds * 1000;

  blacklistedTokenHashes.set(hash, expiresAt);
  await persistTokenHash(hash, new Date(expiresAt).toISOString());
}

export async function isTokenBlacklisted(token: string) {
  const now = Date.now();
  cleanupExpired(now);

  const hash = sha256(token);
  const inMemoryExpiresAt = blacklistedTokenHashes.get(hash);

  if (inMemoryExpiresAt && inMemoryExpiresAt > now) {
    return true;
  }

  return lookupTokenHash(hash);
}
