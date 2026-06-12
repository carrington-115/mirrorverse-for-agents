"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "@/lib/trpc/client";
import { getPlanLimitMessage } from "@/features/billing/lib/plan-limit-error";

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
    onError: (err) => {
      if (getPlanLimitMessage(err)) return;
      toast.error("Failed to retry the run. Please try again.");
    },
  });
}

export function useTriggerManualRunMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.runs.triggerManual.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.runs.list.queryKey() });
      toast.success("Run started.");
    },
    onError: (err) => {
      if (getPlanLimitMessage(err)) return;
      toast.error("Failed to start run. Make sure the workflow is active.");
    },
  });
}

export function useCancelRunMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.runs.cancel.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.runs.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.runs.statsByDay.queryKey() });
      toast.success("Run cancelled.");
    },
    onError: (err) => {
      if (getPlanLimitMessage(err)) return;
      toast.error("Failed to cancel the run.");
    },
  });
}
