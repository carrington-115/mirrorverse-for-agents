import { z } from "zod";

export const toolkitInfoInput = z.object({
  slugs: z.array(z.string().min(1).max(128)).min(1).max(20),
});

export const initiateAppConnectionInput = z.object({
  appSlug: z.string().min(1).max(128),
  chatId: z.string().min(1).max(128),
});

export type ToolkitInfoInput = z.infer<typeof toolkitInfoInput>;
export type InitiateAppConnectionInput = z.infer<
  typeof initiateAppConnectionInput
>;
