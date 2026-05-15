import { z } from "zod";

export const listAuditInput = z.object({
  workspaceId: z.string().min(1),
  cursor: z.string().optional(),
  action: z.string().optional(),
  range: z
    .object({
      from: z.coerce.date(),
      to: z.coerce.date(),
    })
    .optional(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ListAuditInput = z.infer<typeof listAuditInput>;
