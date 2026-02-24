import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/security/logger";

type SecurityEventOutcome = "success" | "failure" | "blocked" | "suspicious";
type SecurityEventRisk = "low" | "medium" | "high" | "critical";

export async function recordSecurityEvent({
  eventType,
  outcome,
  riskLevel,
  ip,
  userAgent,
  email,
  userId,
  metadata,
}: {
  eventType: string;
  outcome: SecurityEventOutcome;
  riskLevel: SecurityEventRisk;
  ip?: string;
  userAgent?: string;
  email?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = createAdminSupabaseClient() as unknown as {
    from: (table: string) => {
      insert: (payload: Record<string, unknown>) => Promise<{ error: { code?: string; message: string } | null }>;
    };
  };

  try {
    const { error } = await admin.from("security_audit_logs").insert({
      event_type: eventType,
      outcome,
      risk_level: riskLevel,
      ip_address: ip ?? null,
      user_agent: userAgent ?? null,
      email: email ?? null,
      user_id: userId ?? null,
      metadata: metadata ?? {},
    });

    if (!error) {
      return;
    }

    const message = (error.message ?? "").toLowerCase();
    const missingTable =
      error.code === "42P01" ||
      error.code === "PGRST205" ||
      message.includes("security_audit_logs") ||
      message.includes("relation");

    if (!missingTable) {
      logger.warn("[SecurityAudit] Failed to persist security event:", error.message);
    }
  } catch (error) {
    logger.warn("[SecurityAudit] Unexpected logging failure:", error);
  }
}
