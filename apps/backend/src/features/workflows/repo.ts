import { createHash, randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";
import type { WorkflowDocumentInput } from "@mirrorverse/agent";
import type { WorkflowDocument, WorkflowStatus } from "@mirrorverse/types";

const {
  workflows,
  workflowVersions,
  workflowRuns,
  connections,
  workspaceEnvVars,
} = schema;

export const WORKFLOW_ACTIVITY_DAYS = 14;

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
      respondsToSlackMentions: workflows.respondsToSlackMentions,
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

// Returns, for each workflow ID, the number of runs started per day over the
// last `WORKFLOW_ACTIVITY_DAYS` days (oldest first) — used for the small
// activity sparkline in the workflows settings tab.
export async function getWorkflowActivityCounts(
  db: Database,
  workspaceId: string,
  workflowIds: readonly string[],
  days: number = WORKFLOW_ACTIVITY_DAYS,
): Promise<Map<string, number[]>> {
  const result = new Map<string, number[]>();
  if (workflowIds.length === 0) return result;

  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - (days - 1));

  const rows = await db
    .select({
      workflowId: workflowRuns.workflowId,
      day: sql<string>`date_trunc('day', ${workflowRuns.startedAt})::text`,
      total: sql<number>`count(*)::int`,
    })
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.workspaceId, workspaceId),
        inArray(workflowRuns.workflowId, [...workflowIds]),
        gte(workflowRuns.startedAt, since),
      ),
    )
    .groupBy(
      workflowRuns.workflowId,
      sql`date_trunc('day', ${workflowRuns.startedAt})`,
    );

  const countsByDay = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const dayMap = countsByDay.get(row.workflowId) ?? new Map<string, number>();
    dayMap.set(row.day.slice(0, 10), row.total);
    countsByDay.set(row.workflowId, dayMap);
  }

  for (const workflowId of workflowIds) {
    const dayMap = countsByDay.get(workflowId);
    const counts: number[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < days; i++) {
      const key = cursor.toISOString().slice(0, 10);
      counts.push(dayMap?.get(key) ?? 0);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    result.set(workflowId, counts);
  }

  return result;
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
// Every workflow created through Mirrorpilot has this set; a null result means
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

export async function setWorkflowStatus(
  db: Database,
  workflowId: string,
  workspaceId: string,
  status: WorkflowStatus,
) {
  const [row] = await db
    .update(workflows)
    .set({ status })
    .where(
      and(eq(workflows.id, workflowId), eq(workflows.workspaceId, workspaceId)),
    )
    .returning({ id: workflows.id, status: workflows.status });
  return row ?? null;
}

// Activates a workflow and pins the version that triggers will execute.
export async function markWorkflowDeployed(
  db: Database,
  workflowId: string,
  workspaceId: string,
  versionId: string,
) {
  const [row] = await db
    .update(workflows)
    .set({
      status: "active",
      deployedVersionId: versionId,
      deployedAt: new Date(),
    })
    .where(
      and(eq(workflows.id, workflowId), eq(workflows.workspaceId, workspaceId)),
    )
    .returning({
      id: workflows.id,
      status: workflows.status,
      deployedVersionId: workflows.deployedVersionId,
      deployedAt: workflows.deployedAt,
    });
  return row ?? null;
}

export async function getVersionById(
  db: Database,
  versionId: string,
  workspaceId: string,
) {
  const [row] = await db
    .select()
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.id, versionId),
        eq(workflowVersions.workspaceId, workspaceId),
      ),
    )
    .limit(1);
  return row ?? null;
}

// Lower-cased app slugs with an active connection, for deploy validation.
export async function listConnectedAppSlugs(
  db: Database,
  workspaceId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ appSlug: connections.appSlug })
    .from(connections)
    .where(
      and(
        eq(connections.workspaceId, workspaceId),
        eq(connections.status, "active"),
      ),
    );
  return new Set(rows.map((r) => r.appSlug.toLowerCase()));
}

export async function listEnvVarNames(
  db: Database,
  workspaceId: string,
): Promise<Set<string>> {
  const rows = await db
    .select({ name: workspaceEnvVars.name })
    .from(workspaceEnvVars)
    .where(eq(workspaceEnvVars.workspaceId, workspaceId));
  return new Set(rows.map((r) => r.name));
}

export async function setSlackAgentWorkflow(
  db: Database,
  workflowId: string,
  workspaceId: string,
  enabled: boolean,
) {
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

    if (enabled) {
      await tx
        .update(workflows)
        .set({ respondsToSlackMentions: false })
        .where(
          and(
            eq(workflows.workspaceId, workspaceId),
            eq(workflows.respondsToSlackMentions, true),
          ),
        );
    }

    const [row] = await tx
      .update(workflows)
      .set({ respondsToSlackMentions: enabled })
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.workspaceId, workspaceId),
        ),
      )
      .returning({
        id: workflows.id,
        respondsToSlackMentions: workflows.respondsToSlackMentions,
      });

    return row ?? null;
  });
}

// Privileged lookup (no workspace filter) for the Slack Events webhook: finds
// whichever active workflow is flagged to answer Slack mentions and returns
// its deployed document, regardless of which workspace owns it.
export async function getSlackAgentWorkflowDocument(db: Database): Promise<{
  workspaceId: string;
  workflowId: string;
  workflowVersionId: string;
  document: WorkflowDocument;
} | null> {
  const [row] = await db
    .select({
      workspaceId: workflows.workspaceId,
      workflowId: workflows.id,
      workflowVersionId: workflowVersions.id,
      document: workflowVersions.document,
    })
    .from(workflows)
    .innerJoin(
      workflowVersions,
      eq(workflows.deployedVersionId, workflowVersions.id),
    )
    .where(
      and(
        eq(workflows.respondsToSlackMentions, true),
        eq(workflows.status, "active"),
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
    const docWithVersion: WorkflowDocumentInput = {
      ...document,
      id: workflowId,
      version: nextVersionNumber,
    };

    await tx.insert(workflowVersions).values({
      id: versionId,
      workspaceId,
      workflowId,
      versionNumber: nextVersionNumber,
      document: docWithVersion as unknown as WorkflowDocument,
      compiledAgent: null,
      createdBy: userId,
      generatedByChatId: null,
      summary,
      checksum: checksumDocument(docWithVersion),
    });

    await tx
      .update(workflows)
      .set({
        currentVersionId: versionId,
        name: document.name,
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
