import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/onboarding/verify-account",
  "/auth/callback",
  "/invite",
  "/review",
];

const PROTECTED_ROUTE_PREFIXES = ["/workspace", "/onboarding"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip session refresh on the OAuth callback — the route handler is about to
  // establish a new session via exchangeCodeForSession. Running updateSession
  // here makes a network call that times out and can overwrite the cookies the
  // route handler sets (clearing the new session before it's used).
  if (matchesPrefix(pathname, ["/auth/callback"])) {
    return NextResponse.next({ request });
  }

  const { response, user } = await updateSession(request);

  if (pathname === "/" && !user) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  const isPublic = matchesPrefix(pathname, PUBLIC_ROUTE_PREFIXES);
  const isProtected = matchesPrefix(pathname, PROTECTED_ROUTE_PREFIXES);

  if (isProtected && !user && !isPublic) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
