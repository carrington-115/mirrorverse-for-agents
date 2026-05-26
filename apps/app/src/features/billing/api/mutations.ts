"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/lib/trpc/client";

export function useOpenPortalMutation() {
  const trpc = useTRPC();
  return useMutation({
    ...trpc.billing.openCustomerPortal.mutationOptions(),
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: () => {
      toast.error("Could not open billing portal. Please try again.");
    },
  });
}
