import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@mirrorverse/env/app";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/mirrorpilot";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", origin));
  }

  // Build the redirect response first so the Supabase client can write
  // Set-Cookie headers directly onto it. Using createClient() (which writes
  // to next/headers cookieStore) and then returning a fresh NextResponse
  // drops those cookies — the redirect arrives with no session.
  const response = NextResponse.redirect(new URL(next, origin));

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/sign-in", origin);
    url.searchParams.set("error", error.message);
    return NextResponse.redirect(url);
  }

  return response;
}
