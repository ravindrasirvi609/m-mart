import { type NextRequest } from "next/server";

import { consumeRateLimit } from "@/lib/security/rate-limit";

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const limiter = consumeRateLimit({
    key: `api_health:${ip}`,
    limit: 60,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return Response.json(
      { status: "error", error: "Too many requests." },
      {
        status: 429,
        headers: {
          "Retry-After": String(limiter.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return Response.json(
    {
      status: "ok",
      service: "mmart-web",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
