"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useMeQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.auth.me.queryOptions());
}
