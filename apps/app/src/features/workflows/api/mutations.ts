"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useDeleteWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    },
  });
}

export function useReorderWorkflowsMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.reorder.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    },
  });
}
