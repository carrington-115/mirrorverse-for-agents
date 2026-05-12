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
