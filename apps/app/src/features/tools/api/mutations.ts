"use client";

import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useCreateMcpServerMutation() {
  const trpc = useTRPC();
  return useMutation(trpc.tools.createMcpServer.mutationOptions());
}
