import { and, desc, eq, schema, type Database } from "@mirrorverse/db";

const { workflows, workflowVersions } = schema;

export async function listWorkflowsForWorkspace(
  db: Database,
  workspaceId: string,
  limit: number,
) {
  return db
    .select({
      id: workflows.id,
      name: workflows.name,
      description: workflows.description,
      kind: workflows.kind,
      status: workflows.status,
      currentVersionId: workflows.currentVersionId,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(eq(workflows.workspaceId, workspaceId))
    .orderBy(desc(workflows.updatedAt))
    .limit(limit);
}

export async function getWorkflowForWorkspace(
  db: Database,
  workflowId: string,
  workspaceId: string,
) {
  const [row] = await db
    .select()
    .from(workflows)
    .where(
      and(eq(workflows.id, workflowId), eq(workflows.workspaceId, workspaceId)),
    )
    .limit(1);
  return row ?? null;
}

export async function getLatestVersion(
  db: Database,
  workflowId: string,
  workspaceId: string,
) {
  const [row] = await db
    .select()
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(workflowVersions.versionNumber))
    .limit(1);
  return row ?? null;
}
