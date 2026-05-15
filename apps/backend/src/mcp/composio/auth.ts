import { randomUUID } from "node:crypto";
import { eq, schema, type Database } from "@mirrorverse/db";

export interface CreateConnectionRequestArgs {
  readonly workspaceId: string;
  readonly chatId: string;
  readonly mcpServerId: string;
  readonly appSlug: string;
  readonly redirectUrl: string;
}

export async function createConnectionRequest(
  db: Database,
  args: CreateConnectionRequestArgs,
) {
  const id = randomUUID();
  const resumeEventName = `connection.completed.${id}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const [row] = await db
    .insert(schema.connectionRequests)
    .values({
      id,
      workspaceId: args.workspaceId,
      chatId: args.chatId,
      mcpServerId: args.mcpServerId,
      appSlug: args.appSlug,
      redirectUrl: args.redirectUrl,
      resumeEventName,
      status: "pending",
      expiresAt,
    })
    .returning();

  return row!;
}

export async function resolveConnectionRequest(
  db: Database,
  connectionRequestId: string,
  resolvedConnectionId: string,
) {
  await db
    .update(schema.connectionRequests)
    .set({ status: "completed", resolvedConnectionId })
    .where(eq(schema.connectionRequests.id, connectionRequestId));
}

export async function findPendingConnectionRequest(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(schema.connectionRequests)
    .where(eq(schema.connectionRequests.id, id))
    .limit(1);
  return row ?? null;
}
