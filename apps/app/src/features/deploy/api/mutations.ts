"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useBuyNumberMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.voice.buyNumber.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.voice.listNumbers.queryKey() }),
  });
}

export function useReleaseNumberMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.voice.releaseNumber.mutationOptions(),
    onSuccess: () => qc.invalidateQueries({ queryKey: trpc.voice.listNumbers.queryKey() }),
  });
}
