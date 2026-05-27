import { z } from "zod";

export const jsonObject = z.record(z.string(), z.unknown());

const position = z.object({ x: z.number(), y: z.number() }).strict();

export const workflowNode = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    position,
    params: z.record(z.string(), z.unknown()).default({}),
    credentialsId: z.string().optional(),
  })
  .strict();

export const workflowConnection = z
  .object({
    from: z.string().min(1),
    fromPort: z.string().min(1),
    to: z.string().min(1),
    toPort: z.string().min(1),
  })
  .strict();

export const workflowDocumentSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).max(200),
    version: z.number().int().min(1).optional(),
    nodes: z.array(workflowNode).min(1),
    connections: z.array(workflowConnection),
  })
  .strict();

export type WorkflowDocumentInput = z.infer<typeof workflowDocumentSchema>;
export type WorkflowNodeInput = z.infer<typeof workflowNode>;
export type WorkflowConnectionInput = z.infer<typeof workflowConnection>;
