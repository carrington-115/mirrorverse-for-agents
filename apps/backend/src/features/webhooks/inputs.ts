import { z } from "zod";

const customHeaderSchema = z.object({
  name: z.string().min(1).max(256),
  value: z.string().max(2048),
});

const credentialsSchema = z
  .union([
    z.object({ apiKey: z.string().min(1) }),
    z.object({ username: z.string().min(1), password: z.string() }),
    z.object({ headerName: z.string().min(1), headerValue: z.string() }),
  ])
  .nullable();

export const createWebhookInput = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional(),
  url: z.url(),
  authType: z
    .enum(["none", "bearer", "basic", "custom_header"])
    .default("none"),
  credentials: credentialsSchema.optional(),
  customHeaders: z.array(customHeaderSchema).max(20).default([]),
  timeoutSeconds: z.number().int().min(1).max(120).default(30),
  maxRetries: z.number().int().min(0).max(10).default(3),
});

export type CreateWebhookInput = z.infer<typeof createWebhookInput>;

export const deleteWebhookInput = z.object({
  webhookId: z.string().min(1),
});

export type DeleteWebhookInput = z.infer<typeof deleteWebhookInput>;
