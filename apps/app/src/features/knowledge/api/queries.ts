"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

// Ingestion runs asynchronously in Inngest, so while any document is still
// pending/processing we poll so its status badge flips to ready/failed without
// a manual refresh. Once everything settles, polling stops.
const DOC_POLL_MS = 3000;

function hasIngestingDoc(docs: ReadonlyArray<{ status: string }> | undefined): boolean {
  return Boolean(docs?.some((d) => d.status === "pending" || d.status === "processing"));
}

export function useKbsQuery() {
  const trpc = useTRPC();
  return useQuery(trpc.knowledge.listKbs.queryOptions({ limit: 50 }));
}

export function useKbQuery(kbId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.knowledge.getKb.queryOptions({ kbId: kbId ?? "" }),
    enabled: Boolean(kbId),
  });
}

export function useDocumentsQuery(kbId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.knowledge.listDocuments.queryOptions({ kbId: kbId ?? "", limit: 100 }),
    enabled: Boolean(kbId),
    refetchInterval: (query) => (hasIngestingDoc(query.state.data) ? DOC_POLL_MS : false),
  });
}

// Documents a Mirrorpilot chat can see: the user's manually-created knowledge
// bases plus files uploaded during this chat session.
export function useChatKnowledgeDocumentsQuery(chatSessionId: string | null) {
  const trpc = useTRPC();
  return useQuery({
    ...trpc.knowledge.listChatDocuments.queryOptions({
      chatSessionId: chatSessionId ?? "",
      limit: 200,
    }),
    enabled: Boolean(chatSessionId),
    refetchInterval: (query) => (hasIngestingDoc(query.state.data) ? DOC_POLL_MS : false),
  });
}
