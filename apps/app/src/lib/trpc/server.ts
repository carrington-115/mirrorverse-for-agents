import "server-only";

import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@mirrorverse/backend";
import { env } from "@mirrorverse/env/app";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";

// Server-side tRPC client. Hits the backend over HTTP using the current
// user's Supabase access token. Use from RSC / route handlers / server
// actions; do not export from "use client" modules.
export async function createServerTrpcClient() {
  const supabase = await createSupabaseClient();
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {};
  if (data.session) {
    headers.authorization = `Bearer ${data.session.access_token}`;
  }
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${env.NEXT_PUBLIC_API_URL}/api/trpc`,
        transformer: superjson,
        headers,
      }),
    ],
  });
}
