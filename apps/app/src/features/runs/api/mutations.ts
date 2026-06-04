"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";

export function useRetryRunMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.runs.retry.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.runs.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.runs.statsByDay.queryKey() });
      toast.success("Run restarted successfully.");
    },
    onError: () => {
      toast.error("Failed to retry the run. Please try again.");
    },
  });
}
