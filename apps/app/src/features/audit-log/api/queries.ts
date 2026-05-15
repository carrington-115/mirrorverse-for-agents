"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc/client";

export function useAuditLogQuery(
  workspaceId: string,
  opts?: { action?: string; cursor?: string; enabled?: boolean },
) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.audit.list.queryOptions({ workspaceId, action: opts?.action, cursor: opts?.cursor }),
    enabled: opts?.enabled !== false && workspaceId.length > 0,
  });
}
