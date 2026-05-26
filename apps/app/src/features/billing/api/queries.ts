"use client";

import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc/client";

export function useCurrentPlanQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.billing.getCurrentPlan.queryOptions());
}

export function useInvoicesQuery(limit = 20) {
  const trpc = useTRPC();
  return useQuery(trpc.billing.listInvoices.queryOptions({ limit }));
}

export function useUsagePeriodQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.billing.usageThisPeriod.queryOptions());
}
