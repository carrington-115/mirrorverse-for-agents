import { createHash, randomUUID } from "node:crypto";

import { and, desc, eq, schema, type Database } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";

import type { WorkflowDocumentInput } from "../../schemas/workflow";

import { INITIAL_VERSION_NUMBER, INITIAL_WORKFLOW_STATUS } from "./constants";

const { workflows, workflowVersions, chats } = schema;

export interface PersistedWorkflow {
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly versionNumber: number;
}

interface PersistArgs {
  readonly db: Database;
  readonly workspaceId: string;
  readonly userId: string;
  readonly chatId: string;
  readonly document: WorkflowDocumentInput;
  readonly summary: string;
}

function checksumDocument(doc: WorkflowDocumentInput): string {
  return createHash("sha256").update(JSON.stringify(doc)).digest("hex");
}

export interface ExistingWorkflowVersion {
  readonly workflowId: string;
  readonly versionNumber: number;
  readonly document: WorkflowDocumentInput;
}

export async function getLatestVersionForChat(
  db: Database,
  chatId: string,
  workspaceId: string,
): Promise<ExistingWorkflowVersion | null> {
  const [chat] = await db
    .select({ workflowId: chats.workflowId })
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);
  if (!chat?.workflowId) return null;

  const [version] = await db
    .select({
      workflowId: workflowVersions.workflowId,
      versionNumber: workflowVersions.versionNumber,
      document: workflowVersions.document,
    })
    .from(workflowVersions)
    .where(
      and(
        eq(workflowVersions.workflowId, chat.workflowId),
        eq(workflowVersions.workspaceId, workspaceId),
      ),
    )
    .orderBy(desc(workflowVersions.versionNumber))
    .limit(1);
  if (!version) return null;

  return {
    workflowId: version.workflowId,
    versionNumber: version.versionNumber,
    document: version.document as unknown as WorkflowDocumentInput,
  };
}

export async function persistWorkflow(args: PersistArgs): Promise<PersistedWorkflow> {
  const existing = await getLatestVersionForChat(args.db, args.chatId, args.workspaceId);
  const checksum = checksumDocument(args.document);
  const versionId = randomUUID();

  if (existing) {
    const nextVersionNumber = existing.versionNumber + 1;
    await args.db.transaction(async (tx) => {
      await tx.insert(workflowVersions).values({
        id: versionId,
        workspaceId: args.workspaceId,
        workflowId: existing.workflowId,
        versionNumber: nextVersionNumber,
        document: args.document as unknown as WorkflowDocument,
        compiledAgent: null,
        createdBy: args.userId,
        generatedByChatId: args.chatId,
        summary: args.summary,
        checksum,
      });
      await tx
        .update(workflows)
        .set({
          currentVersionId: versionId,
          name: args.document.metadata.title,
          description: args.document.metadata.description ?? null,
          kind: args.document.kind,
        })
        .where(
          and(eq(workflows.id, existing.workflowId), eq(workflows.workspaceId, args.workspaceId)),
        );
    });

    return {
      workflowId: existing.workflowId,
      workflowVersionId: versionId,
      versionNumber: nextVersionNumber,
    };
  }

  const workflowId = randomUUID();
  await args.db.transaction(async (tx) => {
    await tx.insert(workflows).values({
      id: workflowId,
      workspaceId: args.workspaceId,
      name: args.document.metadata.title,
      description: args.document.metadata.description ?? null,
      kind: args.document.kind,
      status: INITIAL_WORKFLOW_STATUS,
      currentVersionId: versionId,
      createdBy: args.userId,
      tags: [],
    });

    await tx.insert(workflowVersions).values({
      id: versionId,
      workspaceId: args.workspaceId,
      workflowId,
      versionNumber: INITIAL_VERSION_NUMBER,
      document: args.document as unknown as WorkflowDocument,
      compiledAgent: null,
      createdBy: args.userId,
      generatedByChatId: args.chatId,
      summary: args.summary,
      checksum,
    });

    await tx.update(chats).set({ workflowId }).where(eq(chats.id, args.chatId));
  });

  return {
    workflowId,
    workflowVersionId: versionId,
    versionNumber: INITIAL_VERSION_NUMBER,
  };
}
