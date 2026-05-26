"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useWorkflowsListQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.workflows.list.queryOptions({ limit: 50 }));
}

export function useWorkflowQuery(workflowId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.workflows.get.queryOptions({ workflowId: workflowId ?? "" }),
    enabled: Boolean(workflowId),
  });
}

export function useWorkflowVersionsQuery(workflowId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.workflows.listVersions.queryOptions({ workflowId: workflowId ?? "" }),
    enabled: Boolean(workflowId),
  });
}

export function useWorkflowVersionQuery(workflowId: string | null, versionNumber: number | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.workflows.getVersion.queryOptions({
      workflowId: workflowId ?? "",
      versionNumber: versionNumber ?? 1,
    }),
    enabled: Boolean(workflowId) && versionNumber != null,
  });
}

export function useComposioAppsQuery() {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.connections.listAvailableIntegrations.queryOptions(),
    staleTime: 60_000,
  });
}
