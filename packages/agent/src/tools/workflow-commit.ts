import { Output, generateText, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { eq, schema, type Database } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";

import { workflowDocumentSchema, type WorkflowDocumentInput } from "../schemas/workflow";
import { WORKFLOW_DOCUMENT_BUILDER_PROMPT } from "../system-prompt";

const { workflows, workflowVersions, chats } = schema;

const DOCUMENT_BUILDER_MODEL = "claude-haiku-4-5";

export interface WorkflowCommitDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly builderModel?: string;
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
      "Commit a workflow generated from the user's request. Pass a natural-language `intent` describing what the workflow should do (triggers, steps, branches, integrations) and a short `summary` for the version log. A document builder will generate the validated WorkflowDocument JSON. Call this once when you have enough detail.",
    inputSchema: z.object({
      summary: z
        .string()
        .min(1)
        .max(500)
        .describe("One-paragraph summary of what this workflow does, for the version log."),
      intent: z
        .string()
        .min(1)
        .max(4000)
        .describe(
          "Plain-English description of the workflow to build. Include: kind (automation / voice-agent / chat-agent / code), trigger, every step in order with the integration/tool involved, any branches/loops/human-review, and any concrete values the user provided (schedules, channels, repo names, prompts). The more specific, the better.",
        ),
    }),
    execute: async ({ summary, intent }): Promise<WorkflowCommitResult> => {
      const { output: document } = await generateText({
        model: anthropic(deps.builderModel ?? DOCUMENT_BUILDER_MODEL),
        output: Output.object({ schema: workflowDocumentSchema }),
        system: WORKFLOW_DOCUMENT_BUILDER_PROMPT,
        prompt: intent,
        providerOptions: {
          anthropic: {
            structuredOutputMode: "outputFormat",
          },
        },
      });

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
