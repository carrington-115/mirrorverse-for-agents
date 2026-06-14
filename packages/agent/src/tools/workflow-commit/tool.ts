import { tool } from "ai";
import { z } from "zod";

import { buildWorkflowDocument } from "./builder";
import {
  DEFAULT_BUILDER_MODEL,
  LOG_PREFIX,
  MAX_ERROR_MESSAGE_LENGTH,
  MAX_INTENT_LENGTH,
  MAX_SUMMARY_LENGTH,
  WORKFLOW_KINDS,
} from "./constants";
import {
  checkCanStartNewWorkflow,
  getLatestVersionForChat,
  persistWorkflow,
  type ChatWorkflowSlot,
} from "./persistence";
import type { WorkflowCommitDeps, WorkflowCommitResult } from "./types";

const inputSchema = z
  .object({
    summary: z
      .string()
      .min(1)
      .max(MAX_SUMMARY_LENGTH)
      .describe("One-paragraph summary of what this workflow does, for the version log."),
    intent: z
      .string()
      .min(1)
      .max(MAX_INTENT_LENGTH)
      .describe(
        `Plain-English description of the workflow to build. Include: kind (${WORKFLOW_KINDS.join(
          " / ",
        )}), trigger, every step in order with the integration/tool involved, any branches/loops/human-review, and any concrete values the user provided (schedules, channels, repo names, prompts). The more specific, the better.`,
      ),
    startNewWorkflow: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Set to true ONLY when the user explicitly asks for an additional, distinct workflow/agent " +
          "unrelated to any workflow already created in this chat. A chat can hold at most 2 workflows. " +
          "Leave false (default) for edits/iterations on an existing workflow.",
      ),
  })
  .strict();

const TOOL_DESCRIPTION =
  "Commit a workflow generated from the user's request. Pass a natural-language `intent` describing what the workflow should do (triggers, steps, branches, integrations) and a short `summary` for the version log. A document builder will generate the validated WorkflowDocument JSON. Set `startNewWorkflow: true` only when building an additional, unrelated workflow (max 2 per chat) — omit it for edits. Call this once when you have enough detail.";

export function makeWorkflowCommitTool(deps: WorkflowCommitDeps) {
  return tool({
    description: TOOL_DESCRIPTION,
    inputSchema,
    execute: async ({ summary, intent, startNewWorkflow }): Promise<WorkflowCommitResult> => {
      const modelId = deps.builderModel ?? DEFAULT_BUILDER_MODEL;
      try {
        let newWorkflowSlot: ChatWorkflowSlot | undefined;
        if (startNewWorkflow) {
          const slotCheck = await checkCanStartNewWorkflow(deps.db, deps.chatId);
          if (!slotCheck.ok) {
            return {
              ok: false,
              code: "MAX_WORKFLOWS_REACHED",
              error:
                "This chat already has 2 workflows — that's the limit per chat. Start a new chat to create another.",
            };
          }
          newWorkflowSlot = slotCheck.slot;
        }

        const existing = startNewWorkflow
          ? null
          : await getLatestVersionForChat(deps.db, deps.chatId, deps.workspaceId);
        const { document, kind } = await buildWorkflowDocument(modelId, intent, deps.onProgress, {
          existingDocument: existing?.document ?? null,
        });
        const persisted = await persistWorkflow({
          db: deps.db,
          workspaceId: deps.workspaceId,
          userId: deps.userId,
          chatId: deps.chatId,
          document,
          kind,
          summary,
          startNewWorkflow: Boolean(startNewWorkflow),
          newWorkflowSlot,
        });

        return {
          ok: true,
          workflowId: persisted.workflowId,
          workflowVersionId: persisted.workflowVersionId,
          versionNumber: persisted.versionNumber,
          title: document.name,
          kind,
          document,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`${LOG_PREFIX} failed:`, message);
        return { ok: false, error: message.slice(0, MAX_ERROR_MESSAGE_LENGTH) };
      }
    },
  });
}
