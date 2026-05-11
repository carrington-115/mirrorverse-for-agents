"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useChatQuery(chatId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.chats.get.queryOptions({ chatId: chatId ?? "" }),
    enabled: Boolean(chatId),
  });
}

export function useChatsListQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.chats.list.queryOptions({ limit: 50 }));
}
