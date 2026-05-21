"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useWebhooksQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.webhooks.list.queryOptions());
}
