import { NextResponse, type NextRequest } from "next/server";

import { env } from "@mirrorverse/env/backend";

// Mirrors the CORS logic from the legacy dev server (src/dev.ts): reflect the
// request origin when it matches CORS_ORIGIN (or when "*" is configured) and
// short-circuit preflight OPTIONS requests.
const ALLOW_HEADERS = "authorization, content-type, x-trpc-source";
const ALLOW_METHODS = "GET, POST, OPTIONS";

function corsHeaders(origin: string | null): Headers {
  const headers = new Headers();
  if (origin && (env.CORS_ORIGIN === "*" || origin === env.CORS_ORIGIN)) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "origin");
    headers.set("access-control-allow-credentials", "true");
    headers.set("access-control-allow-headers", ALLOW_HEADERS);
    headers.set("access-control-allow-methods", ALLOW_METHODS);
  }
  return headers;
}

export function proxy(req: NextRequest): NextResponse {
  const cors = corsHeaders(req.headers.get("origin"));

  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: cors });
  }

  const res = NextResponse.next();
  cors.forEach((value, key) => res.headers.set(key, value));
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
