"use server";

import { Resend } from "resend";
import { headers } from "next/headers";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getServerEnv } from "@/lib/env";
import { recordSecurityEvent } from "@/lib/security/audit";
import {
  getAuthLockState,
  registerAuthFailure,
  registerAuthSuccess,
} from "@/lib/security/auth-monitor";
import { SecurityError, toPublicErrorMessage } from "@/lib/security/errors";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import {
  assertTrustedRequestOrigin,
  getRequestMetadata,
} from "@/lib/security/request";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAGIC_LINK_IP_RATE_LIMIT = { limit: 15, windowMs: 5 * 60_000 };
const MAGIC_LINK_EMAIL_RATE_LIMIT = { limit: 5, windowMs: 10 * 60_000 };

function getSafeNextPath(nextPath: string | undefined, fallback = "/") {
  if (!nextPath) {
    return fallback;
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return fallback;
  }

  return nextPath;
}

export async function sendMagicLinkAction(email: string, nextPath = "/") {
  const metadata = await getRequestMetadata();

  try {
    await assertTrustedRequestOrigin();

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      registerAuthFailure(`magiclink:${normalizedEmail || "invalid"}`);
      await recordSecurityEvent({
        eventType: "magic_link_request_invalid_email",
        outcome: "failure",
        riskLevel: "medium",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
      return { ok: false, error: "Please enter a valid email address." };
    }

    const ipLimiter = consumeRateLimit({
      key: `magiclink:ip:${metadata.ip}`,
      ...MAGIC_LINK_IP_RATE_LIMIT,
    });
    if (!ipLimiter.allowed) {
      await recordSecurityEvent({
        eventType: "magic_link_request_rate_limited_ip",
        outcome: "blocked",
        riskLevel: "high",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        email: normalizedEmail,
      });
      return {
        ok: false,
        error: "Too many attempts. Please wait and try again.",
      };
    }

    const emailLimiter = consumeRateLimit({
      key: `magiclink:email:${normalizedEmail}`,
      ...MAGIC_LINK_EMAIL_RATE_LIMIT,
    });
    if (!emailLimiter.allowed) {
      await recordSecurityEvent({
        eventType: "magic_link_request_rate_limited_email",
        outcome: "blocked",
        riskLevel: "high",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        email: normalizedEmail,
      });
      return {
        ok: false,
        error: "Too many attempts for this email. Please try later.",
      };
    }

    const lockState = getAuthLockState(`magiclink:${normalizedEmail}`);
    if (lockState.locked) {
      await recordSecurityEvent({
        eventType: "magic_link_request_locked",
        outcome: "blocked",
        riskLevel: "high",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        email: normalizedEmail,
        metadata: {
          retryAfterSeconds: lockState.retryAfterSeconds,
        },
      });
      return {
        ok: false,
        error: `Account temporarily locked. Try again in ${lockState.retryAfterSeconds} seconds.`,
      };
    }

    const env = getServerEnv();
    if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
      return { ok: false, error: "Resend is not configured." };
    }

    const supabase = createAdminSupabaseClient();
    const resend = new Resend(env.RESEND_API_KEY);
    const host = (await headers()).get("host");
    const protocol = host?.includes("localhost") ? "http" : "https";
    const fallbackOrigin = host
      ? `${protocol}://${host}`
      : "https://mmart4u.com";
    const origin = (env.NEXT_PUBLIC_BASE_URL ?? fallbackOrigin).replace(
      /\/+$/,
      "",
    );

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    if (error) {
      const failureState = registerAuthFailure(`magiclink:${normalizedEmail}`);
      await recordSecurityEvent({
        eventType: "magic_link_request_generate_failed",
        outcome: "failure",
        riskLevel: failureState.locked ? "high" : "medium",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        email: normalizedEmail,
      });
      return {
        ok: false,
        error: "Unable to send sign-in link right now. Please try again.",
      };
    }

    const tokenHash = data.properties.hashed_token;
    if (!tokenHash) {
      registerAuthFailure(`magiclink:${normalizedEmail}`);
      return { ok: false, error: "Could not generate sign-in token." };
    }

    const safeNextPath = getSafeNextPath(nextPath);
    const callbackUrl = new URL(`${origin}/auth/callback`);
    callbackUrl.searchParams.set("token_hash", tokenHash);
    callbackUrl.searchParams.set("type", "magiclink");
    callbackUrl.searchParams.set("next", safeNextPath);

    const { error: resendError } = await resend.emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: normalizedEmail,
      subject: "Your Mmart Magic Link",
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: #f7f8fa;">
          <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05); border: 1px solid rgba(225, 6, 0, 0.1);">
            <div style="margin-bottom: 30px; text-align: center;">
              <h1 style="color: #e10600; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em;">Mmart</h1>
              <p style="color: #61666d; margin: 5px 0 0; font-size: 14px; font-weight: 500;">Premium Shopping Experience</p>
            </div>
            
            <h2 style="color: #191919; font-size: 20px; font-weight: 700; margin-bottom: 16px;">Sign in to your account</h2>
            
            <p style="color: #61666d; line-height: 1.6; font-size: 16px; margin-bottom: 32px;">
              Hello! Click the button below to securely sign in to Mmart. For your security, this link will expire in 1 hour.
            </p>
            
            <div style="text-align: center; margin-bottom: 32px;">
              <a href="${callbackUrl.toString()}" 
                 style="background: linear-gradient(90deg, #ff3b30, #e10600); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(225, 6, 0, 0.2);">
                 Sign In to Mmart
              </a>
            </div>
            
            <p style="color: #61666d; font-size: 14px; line-height: 1.5; margin-bottom: 0;">
              If you didn't request this email, you can safely ignore it.
            </p>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <p style="color: #bec4ce; font-size: 12px; margin-bottom: 8px;">
              &copy; ${new Date().getFullYear()} Mmart. All rights reserved.
            </p>
            <p style="color: #bec4ce; font-size: 12px;">
              Mukai Nagar, Hinjewadi Phase 1, Pune, Maharashtra
            </p>
          </div>
        </div>
      `,
    });

    if (resendError) {
      registerAuthFailure(`magiclink:${normalizedEmail}`);
      await recordSecurityEvent({
        eventType: "magic_link_request_email_send_failed",
        outcome: "failure",
        riskLevel: "medium",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
        email: normalizedEmail,
      });
      return {
        ok: false,
        error: "Failed to send email. Please try again later.",
      };
    }

    registerAuthSuccess(`magiclink:${normalizedEmail}`);
    await recordSecurityEvent({
      eventType: "magic_link_request_sent",
      outcome: "success",
      riskLevel: "low",
      ip: metadata.ip,
      userAgent: metadata.userAgent,
      email: normalizedEmail,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof SecurityError) {
      await recordSecurityEvent({
        eventType: "magic_link_request_blocked_origin",
        outcome: "blocked",
        riskLevel: "high",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      });
    }

    return {
      ok: false,
      error: toPublicErrorMessage(err, "An unexpected error occurred."),
    };
  }
}
