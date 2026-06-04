"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useRunsListQuery(opts: {
  workflowId?: string;
  status?: string;
  cursor?: string;
  limit?: number;
}) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.runs.list.queryOptions({
      workflowId: opts.workflowId,
      status: opts.status,
      cursor: opts.cursor,
      limit: opts.limit ?? 20,
    }),
    enabled: Boolean(opts.workflowId),
  });
}

export function useRunQuery(id: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.runs.get.queryOptions({ id: id ?? "" }),
    enabled: Boolean(id),
  });
}

export function useRunStatsByDayQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.runs.statsByDay.queryOptions({ days: 30 }));
}
