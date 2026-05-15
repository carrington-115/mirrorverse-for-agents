"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useCompleteOnboardingMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.auth.completeOnboarding.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.auth.me.queryKey() });
    },
  });
}
