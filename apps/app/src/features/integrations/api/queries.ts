"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useConnectionsQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.tools.listConnections.queryOptions());
}

export function useComposioIntegrationsQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.connections.listAvailableIntegrations.queryOptions());
}
