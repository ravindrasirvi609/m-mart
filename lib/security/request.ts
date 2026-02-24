import "server-only";

import { headers } from "next/headers";

import { SecurityError } from "@/lib/security/errors";

function normalizeOrigin(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).origin.toLowerCase();
  } catch {
    return null;
  }
}

function getConfiguredBaseOrigin() {
  try {
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      return null;
    }

    return new URL(process.env.NEXT_PUBLIC_BASE_URL).origin.toLowerCase();
  } catch {
    return null;
  }
}

function extractClientIp(headersList: Headers) {
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return (
    headersList.get("x-real-ip")?.trim() ||
    headersList.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function getRequestMetadata() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol =
    forwardedProto ?? (host?.includes("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");

  const hostOrigin = host ? `${protocol}://${host}` : null;
  const normalizedHostOrigin = normalizeOrigin(hostOrigin);
  const configuredBaseOrigin = getConfiguredBaseOrigin();

  const allowedOrigins = [normalizedHostOrigin, configuredBaseOrigin].filter(
    (entry): entry is string => Boolean(entry),
  );

  return {
    origin: normalizeOrigin(requestHeaders.get("origin")),
    allowedOrigins,
    ip: extractClientIp(requestHeaders),
    userAgent: requestHeaders.get("user-agent") ?? "unknown",
  };
}

export async function assertTrustedRequestOrigin() {
  const { origin, allowedOrigins } = await getRequestMetadata();

  if (!origin) {
    return;
  }

  if (allowedOrigins.length === 0) {
    throw new SecurityError("Request origin could not be validated.");
  }

  if (!allowedOrigins.includes(origin)) {
    throw new SecurityError("Cross-site request blocked.");
  }
}
