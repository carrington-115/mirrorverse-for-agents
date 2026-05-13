import { z } from "zod";

export const listWorkflowsInput = z
  .object({
    limit: z.number().int().min(1).max(100).default(50),
  })
  .default({ limit: 50 });

export const getWorkflowInput = z.object({
  workflowId: z.string().min(1).max(128),
});

export type ListWorkflowsInput = z.infer<typeof listWorkflowsInput>;
export type GetWorkflowInput = z.infer<typeof getWorkflowInput>;
