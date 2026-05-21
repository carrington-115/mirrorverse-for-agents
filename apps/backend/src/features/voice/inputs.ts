import { z } from "zod";

export const searchNumbersInput = z.object({
  countryCode: z.string().length(2).default("US"),
  areaCode: z.number().int().optional(),
  contains: z.string().max(10).optional(),
  voiceEnabled: z.boolean().default(true),
  limit: z.number().int().min(1).max(20).default(10),
  source: z.enum(["managed", "byo"]),
  connectionId: z.string().optional(),
});

export const buyNumberInput = z.object({
  phoneNumber: z.string().regex(/^\+\d{10,15}$/),
  source: z.enum(["managed", "byo"]),
  connectionId: z.string().optional(),
});

export const releaseNumberInput = z.object({
  phoneNumberId: z.string(),
});

export const activateVoiceInput = z.object({
  workflowId: z.string(),
  phoneNumberId: z.string(),
});

export const deactivateVoiceInput = z.object({
  workflowId: z.string(),
});

export const getVoiceAgentInput = z.object({
  voiceAgentId: z.string(),
});

export const listVoiceCallsInput = z.object({
  voiceAgentId: z.string(),
  limit: z.number().int().min(1).max(100).default(50),
});

export type SearchNumbersInput = z.infer<typeof searchNumbersInput>;
export type BuyNumberInput = z.infer<typeof buyNumberInput>;
export type ReleaseNumberInput = z.infer<typeof releaseNumberInput>;
export type ActivateVoiceInput = z.infer<typeof activateVoiceInput>;
export type DeactivateVoiceInput = z.infer<typeof deactivateVoiceInput>;
export type GetVoiceAgentInput = z.infer<typeof getVoiceAgentInput>;
export type ListVoiceCallsInput = z.infer<typeof listVoiceCallsInput>;
