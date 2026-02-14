import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const url = request.nextUrl.clone();

  // Enforce canonical domain (non-www) in production
  // Based on the observed production URL: mmart4u.com
  if (host && host.startsWith("www.") && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const newHost = host.replace("www.", "");
    url.host = newHost;
    return NextResponse.redirect(url, 301);
  }

  return await updateSession(request);
}

// Also export as middleware for backward compatibility
export async function middleware(request: NextRequest) {
  return await proxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
