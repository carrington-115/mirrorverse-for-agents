"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useCreateKbMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.knowledge.createKb.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trpc.knowledge.listKbs.queryKey() });
    },
  });
}

export function useDeleteKbMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.knowledge.deleteKb.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trpc.knowledge.listKbs.queryKey() });
    },
  });
}

export function useIngestMutation(kbId: string) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.knowledge.ingest.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: trpc.knowledge.listDocuments.queryKey({ kbId, limit: 100 }),
      });
    },
  });
}

export function useGetOrCreateSessionKbMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.knowledge.getOrCreateSessionKb.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: trpc.knowledge.listKbs.queryKey() });
    },
  });
}

export function useDeleteDocumentMutation(kbId: string) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.knowledge.deleteDocument.mutationOptions(),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: trpc.knowledge.listDocuments.queryKey({ kbId, limit: 100 }),
      });
    },
  });
}
