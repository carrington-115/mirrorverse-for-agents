import { z } from "zod";

export const createMcpServerInput = z.object({
  name: z.string().min(1).max(120),
  url: z.url(),
});

export type CreateMcpServerInput = z.infer<typeof createMcpServerInput>;

export const revokeConnectionInput = z.object({
  connectionId: z.string().min(1),
});

export type RevokeConnectionInput = z.infer<typeof revokeConnectionInput>;
