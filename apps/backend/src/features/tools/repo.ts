import { and, eq, schema, type Database } from "@mirrorverse/db";

const { mcpServers } = schema;

export interface CreateMcpServerArgs {
  readonly workspaceId: string;
  readonly addedBy: string;
  readonly name: string;
  readonly slug: string;
  readonly url: string;
}

export async function createMcpServer(db: Database, args: CreateMcpServerArgs) {
  const [row] = await db
    .insert(mcpServers)
    .values({
      workspaceId: args.workspaceId,
      addedBy: args.addedBy,
      name: args.name,
      slug: args.slug,
      kind: "user_supplied",
      transport: "http",
      url: args.url,
    })
    .returning();
  return row;
}

export async function listWorkspaceMcpServers(
  db: Database,
  workspaceId: string,
) {
  return db
    .select()
    .from(mcpServers)
    .where(eq(mcpServers.workspaceId, workspaceId));
}

export async function listWorkspaceConnections(
  db: Database,
  workspaceId: string,
) {
  return db
    .select()
    .from(schema.connections)
    .where(eq(schema.connections.workspaceId, workspaceId));
}

export async function revokeConnection(
  db: Database,
  connectionId: string,
  workspaceId: string,
) {
  const [row] = await db
    .update(schema.connections)
    .set({ status: "revoked" })
    .where(
      and(
        eq(schema.connections.id, connectionId),
        eq(schema.connections.workspaceId, workspaceId),
      ),
    )
    .returning();
  return row ?? null;
}
