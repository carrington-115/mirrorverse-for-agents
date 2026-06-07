"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useUpsertEnvVarMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.envVars.upsert.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.envVars.list.queryKey() });
    },
  });
}

export function useDeleteEnvVarMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.envVars.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.envVars.list.queryKey() });
    },
  });
}
