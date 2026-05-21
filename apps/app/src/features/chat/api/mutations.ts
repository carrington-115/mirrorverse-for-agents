"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useDeleteChatMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.chats.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    },
  });
}

export function usePinChatMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.chats.pin.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() }),
  });
}

export function useEditAndTruncateMutation() {
  const trpc = useTRPC();
  return useMutation({ ...trpc.chats.editAndTruncate.mutationOptions() });
}

export function useDeleteLastAssistantMutation() {
  const trpc = useTRPC();
  return useMutation({ ...trpc.chats.deleteLastAssistant.mutationOptions() });
}
