import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTE_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/account-setup/verify-account",
  "/auth/callback",
];

const PROTECTED_ROUTE_PREFIXES = [
  "/mirrropilot",
  "/workflows",
  "/integrations",
  "/deploy",
  "/account-setup",
];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export default async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const target = user ? "/mirrropilot" : "/sign-in";
    return NextResponse.redirect(new URL(target, request.url));
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
