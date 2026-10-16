"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/lib/trpc/client";
import { getPlanLimitMessage } from "@/features/billing/lib/plan-limit-error";

export function useOpenPortalMutation() {
  const trpc = useTRPC();
  return useMutation({
    ...trpc.billing.openCustomerPortal.mutationOptions(),
    onSuccess: (data) => {
      window.open(data.url, "_blank", "noopener,noreferrer");
    },
    onError: (err) => {
      if (getPlanLimitMessage(err)) return;
      toast.error("Could not open billing portal. Please try again.");
    },
  });
}

export function useCreateCheckoutSessionMutation() {
  const trpc = useTRPC();
  return useMutation({
    ...trpc.billing.createCheckoutSession.mutationOptions(),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (err) => {
      if (getPlanLimitMessage(err)) return;
      toast.error("Could not start checkout. Please try again.");
    },
  });
}

export function useRedeemPromoCodeMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.billing.redeemPromoCode.mutationOptions(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: trpc.billing.listPromoRedemptions.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.billing.usageThisPeriod.queryKey() });
      toast.success(
        `${data.code} applied — ${data.credits.toLocaleString()} credits added to your workspace.`,
      );
    },
  });
}
