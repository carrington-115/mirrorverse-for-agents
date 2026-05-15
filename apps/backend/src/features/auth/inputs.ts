import { z } from "zod";

export const syncProfileInput = z.object({
  email: z.email(),
  fullName: z.string().min(1).max(120).optional(),
  avatarUrl: z.url().optional(),
});

export type SyncProfileInput = z.infer<typeof syncProfileInput>;

export const completeOnboardingInput = z.object({
  name: z.string().min(1).max(120),
  hearAboutUs: z.string().max(60).optional(),
  role: z.string().max(60).optional(),
  otherRole: z.string().max(120).optional(),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingInput>;
