"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export interface UseDirectoryListInput {
  category?: string;
  search?: string;
  limit?: number;
}

export function useDirectoryListQuery(input: UseDirectoryListInput = {}) {
  const trpc = useTRPC();
  const { limit = 50, ...rest } = input;
  return useQuery({
    ...trpc.mcpDirectory.list.queryOptions({ limit, ...rest }),
    placeholderData: keepPreviousData,
  });
}

export function useDirectoryEntryQuery(slug: string | null) {
  const trpc = useTRPC();
  return useQuery(
    trpc.mcpDirectory.getBySlug.queryOptions({ slug: slug ?? "" }, { enabled: Boolean(slug) }),
  );
}
