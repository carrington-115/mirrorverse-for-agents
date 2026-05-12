"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useDeleteChatMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.chats.delete.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() }),
  });
}
