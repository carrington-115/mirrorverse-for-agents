"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useConnectionsQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.tools.listConnections.queryOptions());
}
