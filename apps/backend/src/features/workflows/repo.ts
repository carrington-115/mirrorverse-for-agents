import { createHash, randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  inArray,
  schema,
  type Database,
} from "@mirrorverse/db";
import type { WorkflowDocumentInput } from "@mirrorverse/agent";
import type { WorkflowDocument } from "@mirrorverse/types";

const { workflows, workflowVersions } = schema;

function checksumDocument(doc: WorkflowDocumentInput): string {
  return createHash("sha256").update(JSON.stringify(doc)).digest("hex");
}

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
      sortOrder: workflows.sortOrder,
      createdAt: workflows.createdAt,
      updatedAt: workflows.updatedAt,
    })
    .from(workflows)
    .where(eq(workflows.workspaceId, workspaceId))
    .orderBy(asc(workflows.sortOrder), desc(workflows.updatedAt))
    .limit(limit);
}

export async function deleteWorkflowForWorkspace(
  db: Database,
  workflowId: string,
  workspaceId: string,
): Promise<boolean> {
  const result = await db
    .delete(workflows)
    .where(
      and(eq(workflows.id, workflowId), eq(workflows.workspaceId, workspaceId)),
    )
    .returning({ id: workflows.id });
  return result.length > 0;
}

export async function renameWorkflowForWorkspace(
  db: Database,
  workflowId: string,
  workspaceId: string,
  name: string,
) {
  const [row] = await db
    .update(workflows)
    .set({ name })
    .where(
      and(eq(workflows.id, workflowId), eq(workflows.workspaceId, workspaceId)),
    )
    .returning({ id: workflows.id, name: workflows.name });
  return row ?? null;
}

export async function updateWorkflowSortOrders(
  db: Database,
  workspaceId: string,
  orderedIds: readonly string[],
): Promise<number> {
  if (orderedIds.length === 0) return 0;

  return db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: workflows.id })
      .from(workflows)
      .where(
        and(
          eq(workflows.workspaceId, workspaceId),
          inArray(workflows.id, [...orderedIds]),
        ),
      );
    const ownedSet = new Set(owned.map((r) => r.id));
    const validIds = orderedIds.filter((id) => ownedSet.has(id));

    for (let i = 0; i < validIds.length; i++) {
      await tx
        .update(workflows)
        .set({ sortOrder: i })
        .where(
          and(
            eq(workflows.id, validIds[i]),
            eq(workflows.workspaceId, workspaceId),
          ),
        );
    }
    return validIds.length;
  });
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

// Returns the generatedByChatId of the first (origin) version of a workflow.
// Every workflow created through Mirropilot has this set; a null result means
// the workflow was created outside the chat flow.
export async function getOriginChatId(
  db: Database,
  workflowId: string,
  workspaceId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ generatedByChatId: workflowVersions.generatedByChatId })
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.workspaceId, workspaceId),
      ),
    )
    .orderBy(workflowVersions.versionNumber)
    .limit(1);
  return row?.generatedByChatId ?? null;
}

export async function listVersionsForWorkflow(
  db: Database,
  workflowId: string,
  workspaceId: string,
) {
  return db
    .select({
      id: workflowVersions.id,
      versionNumber: workflowVersions.versionNumber,
      summary: workflowVersions.summary,
      generatedByChatId: workflowVersions.generatedByChatId,
      createdBy: workflowVersions.createdBy,
      createdAt: workflowVersions.createdAt,
    })
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(workflowVersions.versionNumber));
}

export async function getVersionByNumber(
  db: Database,
  workflowId: string,
  workspaceId: string,
  versionNumber: number,
) {
  const [row] = await db
    .select()
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, workflowId),
        eq(workflowVersions.workspaceId, workspaceId),
        eq(workflowVersions.versionNumber, versionNumber),
      ),
    )
    .limit(1);
  return row ?? null;
}

export interface SaveWorkflowVersionResult {
  readonly id: string;
  readonly versionNumber: number;
}

export async function saveWorkflowVersionForWorkspace(
  db: Database,
  workspaceId: string,
  workflowId: string,
  userId: string,
  document: WorkflowDocumentInput,
  summary: string,
): Promise<SaveWorkflowVersionResult | null> {
  return db.transaction(async (tx) => {
    const [workflow] = await tx
      .select({ id: workflows.id })
      .from(workflows)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.workspaceId, workspaceId),
        ),
      )
      .limit(1);
    if (!workflow) return null;

    const [latest] = await tx
      .select({ versionNumber: workflowVersions.versionNumber })
      .from(workflowVersions)
      .where(
        and(
          eq(workflowVersions.workflowId, workflowId),
          eq(workflowVersions.workspaceId, workspaceId),
        ),
      )
      .orderBy(desc(workflowVersions.versionNumber))
      .limit(1);
    const nextVersionNumber = (latest?.versionNumber ?? 0) + 1;
    const versionId = randomUUID();

    await tx.insert(workflowVersions).values({
      id: versionId,
      workspaceId,
      workflowId,
      versionNumber: nextVersionNumber,
      document: document as unknown as WorkflowDocument,
      compiledAgent: null,
      createdBy: userId,
      generatedByChatId: null,
      summary,
      checksum: checksumDocument(document),
    });

    await tx
      .update(workflows)
      .set({
        currentVersionId: versionId,
        name: document.metadata.title,
        description: document.metadata.description ?? null,
        kind: document.kind,
      })
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.workspaceId, workspaceId),
        ),
      );

    return { id: versionId, versionNumber: nextVersionNumber };
  });
}
