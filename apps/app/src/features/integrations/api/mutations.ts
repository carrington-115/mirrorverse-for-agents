"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useRevokeConnectionMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.tools.revokeConnection.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.tools.listConnections.queryFilter());
      },
    }),
  );
}
