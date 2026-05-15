import { createHash, randomUUID } from "node:crypto";

import { eq, schema, type Database } from "@mirrorverse/db";
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

export async function persistWorkflow(args: PersistArgs): Promise<PersistedWorkflow> {
  const workflowId = randomUUID();
  const versionId = randomUUID();
  const checksum = checksumDocument(args.document);

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
