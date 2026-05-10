import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@mirrorverse/env/app";

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[], _headers: Record<string, string>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll called from a Server Component — safe to ignore when middleware refreshes the session.
          // Headers (cache-control) cannot be set from RSC either; middleware handles it.
        }
      },
    },
  });
}
