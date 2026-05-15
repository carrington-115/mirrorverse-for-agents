import { tool } from "ai";
import { z } from "zod";

import { buildWorkflowDocument } from "./builder";
import { DEFAULT_BUILDER_MODEL } from "./constants";
import { persistWorkflow } from "./persistence";
import type { WorkflowCommitDeps, WorkflowCommitResult } from "./types";

const inputSchema = z.object({
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
});

const TOOL_DESCRIPTION =
  "Commit a workflow generated from the user's request. Pass a natural-language `intent` describing what the workflow should do (triggers, steps, branches, integrations) and a short `summary` for the version log. A document builder will generate the validated WorkflowDocument JSON. Call this once when you have enough detail.";

export function makeWorkflowCommitTool(deps: WorkflowCommitDeps) {
  return tool({
    description: TOOL_DESCRIPTION,
    inputSchema,
    execute: async ({ summary, intent }): Promise<WorkflowCommitResult> => {
      const modelId = deps.builderModel ?? DEFAULT_BUILDER_MODEL;
      try {
        const document = await buildWorkflowDocument(modelId, intent);
        const persisted = await persistWorkflow({
          db: deps.db,
          workspaceId: deps.workspaceId,
          userId: deps.userId,
          chatId: deps.chatId,
          document,
          summary,
        });

        return {
          ok: true,
          workflowId: persisted.workflowId,
          workflowVersionId: persisted.workflowVersionId,
          versionNumber: persisted.versionNumber,
          title: document.metadata.title,
          kind: document.kind,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[workflow_commit] failed:", message);
        return { ok: false, error: message.slice(0, 800) };
      }
    },
  });
}
