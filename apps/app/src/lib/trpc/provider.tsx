"use client";

import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@mirrorverse/backend";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getQueryClient } from "@/lib/query/client";
import { TRPC_BASE_URL } from "./config";
import { TRPCProvider } from "./client";

export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: TRPC_BASE_URL,
          transformer: superjson,
          async headers() {
            const supabase = createSupabaseClient();
            const { data } = await supabase.auth.getSession();
            const headers: Record<string, string> = {};
            if (data.session) {
              headers.authorization = `Bearer ${data.session.access_token}`;
            }
            return headers;
          },
        }),
      ],
    }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
        {process.env.NODE_ENV === "development" ? (
          <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
        ) : null}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
