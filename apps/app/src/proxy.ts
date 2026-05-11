import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/onboarding/verify-account",
  "/auth/callback",
  "/invite",
];

const PROTECTED_ROUTE_PREFIXES = ["/workspace", "/onboarding"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

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
