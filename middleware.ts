import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  // Normalize double-slash paths (e.g. //auth/callback → /auth/callback)
  // which can occur if NEXT_PUBLIC_BASE_URL has a trailing slash.
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("//")) {
    const normalizedUrl = request.nextUrl.clone();
    normalizedUrl.pathname = pathname.replace(/^\/\/+/, "/");
    return NextResponse.redirect(normalizedUrl, 308);
  }

  return updateSession(request);
}

// Also export as middleware for backward compatibility
export async function middleware(request: NextRequest) {
  return proxy(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
