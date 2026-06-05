"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/lib/trpc/client";

export function useDeleteWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.delete.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
      // chats.workflow_id is FK set-null on delete; refetch chats so the side
      // panel and chat list reflect the cleared linkage instead of pointing
      // at a workflowId that returns { workflow: null, version: null }.
      qc.invalidateQueries({ queryKey: trpc.chats.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.chats.get.queryKey() });
    },
  });
}

export function useReorderWorkflowsMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.reorder.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    },
  });
}

export function useSaveWorkflowVersionMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.saveVersion.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.get.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.listVersions.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
    },
  });
}

export function useRenameWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.rename.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.get.queryKey() });
    },
  });
}

export function useActivateWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.activate.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.get.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.webhooks.listEndpoints.queryKey() });
    },
  });
}

export function useDeactivateWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.deactivate.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.get.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.webhooks.listEndpoints.queryKey() });
    },
  });
}

export function useRunWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.run.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.runs.list.queryKey() });
    },
  });
}

export function useRestartWorkflowMutation() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  return useMutation({
    ...trpc.workflows.restart.mutationOptions(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: trpc.workflows.list.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.workflows.get.queryKey() });
      qc.invalidateQueries({ queryKey: trpc.webhooks.listEndpoints.queryKey() });
    },
  });
}
