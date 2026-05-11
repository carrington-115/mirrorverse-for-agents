import { z } from "zod";

export const syncProfileInput = z.object({
  email: z.email(),
  fullName: z.string().min(1).max(120).optional(),
  avatarUrl: z.url().optional(),
});

export type SyncProfileInput = z.infer<typeof syncProfileInput>;
