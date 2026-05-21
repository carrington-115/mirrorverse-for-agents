"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useCreateWebhookMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.webhooks.create.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.webhooks.list.queryFilter());
      },
    }),
  );
}

export function useDeleteWebhookMutation() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  return useMutation(
    trpc.webhooks.delete.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries(trpc.webhooks.list.queryFilter());
      },
    }),
  );
}
