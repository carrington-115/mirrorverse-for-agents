import {
  and,
  desc,
  eq,
  gte,
  inArray,
  lt,
  lte,
  schema,
  type Database,
} from "@mirrorverse/db";
import type { WorkspaceRole } from "@mirrorverse/types";

import type { ListAuditInput } from "./inputs";

export async function listAuditLog(
  db: Database,
  input: ListAuditInput,
): Promise<{
  items: (typeof schema.auditLog.$inferSelect)[];
  nextCursor: string | undefined;
}> {
  const conditions = [eq(schema.auditLog.workspaceId, input.workspaceId)];

  if (input.cursor) conditions.push(lt(schema.auditLog.id, input.cursor));
  if (input.action) conditions.push(eq(schema.auditLog.action, input.action));
  if (input.range) {
    conditions.push(gte(schema.auditLog.ts, input.range.from));
    conditions.push(lte(schema.auditLog.ts, input.range.to));
  }

  const rows = await db
    .select()
    .from(schema.auditLog)
    .where(and(...conditions))
    .orderBy(desc(schema.auditLog.ts))
    .limit(input.limit + 1);

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;
  const nextCursor = hasMore
    ? (items[items.length - 1]?.id ?? undefined)
    : undefined;

  return { items, nextCursor };
}

export async function isWorkspaceAdminOrOwner(
  db: Database,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const row = await db
    .select({ id: schema.workspaceMembers.id })
    .from(schema.workspaceMembers)
    .where(
      and(
        eq(schema.workspaceMembers.workspaceId, workspaceId),
        eq(schema.workspaceMembers.userId, userId),
        inArray(schema.workspaceMembers.role, [
          "owner",
          "admin",
        ] as WorkspaceRole[]),
      ),
    )
    .limit(1);

  return row.length > 0;
}
