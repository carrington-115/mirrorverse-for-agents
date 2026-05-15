import { z } from "zod";

export const listWorkflowsInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

export const getWorkflowInput = z.object({
  workflowId: z.string().min(1).max(128),
});

export const deleteWorkflowInput = z.object({
  workflowId: z.string().min(1).max(128),
});

export const renameWorkflowInput = z.object({
  workflowId: z.string().min(1).max(128),
  name: z.string().min(1).max(200),
});

export const reorderWorkflowsInput = z.object({
  workflowIds: z.array(z.string().min(1).max(128)).min(1).max(500),
});

export const listWorkflowVersionsInput = z.object({
  workflowId: z.string().min(1).max(128),
});

export const getWorkflowVersionInput = z.object({
  workflowId: z.string().min(1).max(128),
  versionNumber: z.number().int().min(1),
});

export type ListWorkflowsInput = z.infer<typeof listWorkflowsInput>;
export type GetWorkflowInput = z.infer<typeof getWorkflowInput>;
export type DeleteWorkflowInput = z.infer<typeof deleteWorkflowInput>;
export type RenameWorkflowInput = z.infer<typeof renameWorkflowInput>;
export type ReorderWorkflowsInput = z.infer<typeof reorderWorkflowsInput>;
export type ListWorkflowVersionsInput = z.infer<
  typeof listWorkflowVersionsInput
>;
export type GetWorkflowVersionInput = z.infer<typeof getWorkflowVersionInput>;
