"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query/keys";

export function useEnvVarsQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.envVars.list.queryOptions());
}

export function useActiveSessionQuery() {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session;
    },
    staleTime: 60_000,
  });
}
