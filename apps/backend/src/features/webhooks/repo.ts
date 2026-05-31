import { and, eq, schema, type Database } from "@mirrorverse/db";
import type { CreateWebhookInput } from "./inputs.js";

const { webhooks } = schema;

export async function createWebhook(
  db: Database,
  workspaceId: string,
  input: CreateWebhookInput,
) {
  const [row] = await db
    .insert(webhooks)
    .values({
      workspaceId,
      name: input.name,
      description: input.description ?? null,
      url: input.url,
      authType: input.authType,
      credentials: input.credentials ?? null,
      customHeaders: input.customHeaders,
      timeoutSeconds: input.timeoutSeconds,
      maxRetries: input.maxRetries,
    })
    .returning();
  return row;
}

export async function listWorkspaceWebhooks(db: Database, workspaceId: string) {
  return db
    .select()
    .from(webhooks)
    .where(eq(webhooks.workspaceId, workspaceId));
}

export async function deleteWebhook(
  db: Database,
  webhookId: string,
  workspaceId: string,
) {
  const [row] = await db
    .delete(webhooks)
    .where(
      and(eq(webhooks.id, webhookId), eq(webhooks.workspaceId, workspaceId)),
    )
    .returning();
  return row ?? null;
}
