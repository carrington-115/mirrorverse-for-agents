import { tool } from "ai";
import { eq, schema, type Database } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";

import { workflowDocumentSchema, type WorkflowDocumentInput } from "../schemas/workflow";

const { workflows, workflowVersions, chats } = schema;

export interface WorkflowCommitDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
}

export interface WorkflowCommitResult {
  readonly workflowId: string;
  readonly workflowVersionId: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly kind: WorkflowDocumentInput["kind"];
}

function checksumDocument(doc: WorkflowDocumentInput): string {
  return createHash("sha256").update(JSON.stringify(doc)).digest("hex");
}

export function makeWorkflowCommitTool(deps: WorkflowCommitDeps) {
  return tool({
    description:
      "Persist a complete WorkflowDocument as a new workflow + first version, then link it back to this chat. Call this exactly once when you have a runnable workflow.",
    inputSchema: z.object({
      summary: z
        .string()
        .min(1)
        .max(500)
        .describe("One-paragraph summary of what this workflow does, for the version log."),
      document: workflowDocumentSchema,
    }),
    execute: async ({ summary, document }): Promise<WorkflowCommitResult> => {
      const workflowId = randomUUID();
      const versionId = randomUUID();
      const checksum = checksumDocument(document);

      await deps.db.transaction(async (tx) => {
        await tx.insert(workflows).values({
          id: workflowId,
          workspaceId: deps.workspaceId,
          name: document.metadata.title,
          description: document.metadata.description ?? null,
          kind: document.kind,
          status: "draft",
          currentVersionId: versionId,
          createdBy: deps.userId,
          tags: [],
        });

        await tx.insert(workflowVersions).values({
          id: versionId,
          workspaceId: deps.workspaceId,
          workflowId,
          versionNumber: 1,
          document: document as unknown as WorkflowDocument,
          compiledAgent: null,
          createdBy: deps.userId,
          generatedByChatId: deps.chatId,
          summary,
          checksum,
        });

        await tx.update(chats).set({ workflowId }).where(eq(chats.id, deps.chatId));
      });

      return {
        workflowId,
        workflowVersionId: versionId,
        versionNumber: 1,
        title: document.metadata.title,
        kind: document.kind,
      };
    },
  });
}
