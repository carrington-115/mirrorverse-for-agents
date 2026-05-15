import { generateText, stepCountIs, tool } from "ai";
import { eq, schema, type Database } from "@mirrorverse/db";
import type { WorkflowDocument } from "@mirrorverse/types";
import { z } from "zod";
import { createHash, randomUUID } from "node:crypto";

import { resolveModel } from "../models/resolve";
import {
  jsonObject,
  workflowConnection,
  workflowDocumentSchema,
  workflowNode,
  type WorkflowConnectionInput,
  type WorkflowDocumentInput,
  type WorkflowNodeInput,
} from "../schemas/workflow";
import { WORKFLOW_DOCUMENT_BUILDER_PROMPT } from "../system-prompt";

const MAX_BUILDER_ATTEMPTS = 2;
const MAX_BUILDER_STEPS = 50;

const WORKFLOW_KINDS = ["automation", "voice-agent", "chat-agent", "code"] as const;

const DEFAULT_WORKFLOW_SETTINGS = {
  executionOrder: "v1",
  binaryMode: "memory",
  errorWorkflowId: null,
  timezone: "UTC",
  executionTimeoutSec: 300,
  saveExecutionProgress: true,
  saveDataSuccessExecution: "all",
  saveDataErrorExecution: "all",
} as const;

interface BuilderMeta {
  readonly kind: (typeof WORKFLOW_KINDS)[number];
  readonly title: string;
  readonly description: string | null;
  readonly notes: string | null;
  readonly entrypointNodeId: string | null;
}

interface BuilderState {
  meta: BuilderMeta | null;
  readonly nodes: WorkflowNodeInput[];
  readonly connections: WorkflowConnectionInput[];
}

function summarizeZodIssues(error: z.ZodError): string {
  return error.issues
    .slice(0, 20)
    .map((issue) => `- ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

// The model assembles the document by calling these tools, one small unit per
// call. Each tool validates against the real per-component schema and returns a
// soft `{ ok: false, error }` instead of throwing — so a malformed node never
// kills the whole build, the model just reads the error and retries that node.
function makeBuilderTools(state: BuilderState) {
  return {
    set_metadata: tool({
      description:
        "Set the workflow kind and metadata. Call exactly once, before adding nodes. For kind 'code', also pass entrypointNodeId (the id of the node execution starts from).",
      inputSchema: z.object({
        kind: z.enum(WORKFLOW_KINDS),
        title: z.string().min(1).max(200),
        description: z.string().nullish(),
        notes: z.string().nullish(),
        entrypointNodeId: z.string().nullish(),
      }),
      execute: ({ kind, title, description, notes, entrypointNodeId }) => {
        state.meta = {
          kind,
          title,
          description: description ?? null,
          notes: notes ?? null,
          entrypointNodeId: entrypointNodeId ?? null,
        };
        return { ok: true as const };
      },
    }),
    add_node: tool({
      description:
        "Add one workflow node. `node` is a complete node object matching the node-kind schema in the system prompt. Returns { ok: false, error } when the node is invalid — read the error and call add_node again with a corrected node.",
      inputSchema: z.object({ node: jsonObject }),
      execute: ({ node }) => {
        const parsed = workflowNode.safeParse(node);
        if (!parsed.success) {
          return { ok: false as const, error: summarizeZodIssues(parsed.error) };
        }
        if (state.nodes.some((n) => n.id === parsed.data.id)) {
          return { ok: false as const, error: `Duplicate node id "${parsed.data.id}".` };
        }
        state.nodes.push(parsed.data);
        return { ok: true as const, nodeId: parsed.data.id };
      },
    }),
    add_connection: tool({
      description:
        "Add one edge between two already-added nodes. `connection` matches the connection schema. Returns { ok: false, error } when invalid — fix and call again.",
      inputSchema: z.object({ connection: jsonObject }),
      execute: ({ connection }) => {
        const parsed = workflowConnection.safeParse(connection);
        if (!parsed.success) {
          return { ok: false as const, error: summarizeZodIssues(parsed.error) };
        }
        const ids = new Set(state.nodes.map((n) => n.id));
        if (!ids.has(parsed.data.fromNodeId)) {
          return {
            ok: false as const,
            error: `fromNodeId "${parsed.data.fromNodeId}" has no matching node — add that node first.`,
          };
        }
        if (!ids.has(parsed.data.toNodeId)) {
          return {
            ok: false as const,
            error: `toNodeId "${parsed.data.toNodeId}" has no matching node — add that node first.`,
          };
        }
        state.connections.push(parsed.data);
        return { ok: true as const };
      },
    }),
  };
}

async function buildWorkflowDocument(
  modelId: string,
  intent: string,
): Promise<WorkflowDocumentInput> {
  let lastError: Error | null = null;
  let priorErrors: string | null = null;

  for (let attempt = 1; attempt <= MAX_BUILDER_ATTEMPTS; attempt++) {
    const state: BuilderState = { meta: null, nodes: [], connections: [] };

    const repairContext = priorErrors
      ? `\n\nYour previous attempt produced an invalid workflow. The validator reported:\n${priorErrors}\n\nBuild it again from scratch and resolve every issue. Keep the same intent.`
      : "";

    try {
      await generateText({
        model: resolveModel(modelId),
        system: WORKFLOW_DOCUMENT_BUILDER_PROMPT,
        prompt: intent + repairContext,
        tools: makeBuilderTools(state),
        stopWhen: stepCountIs(MAX_BUILDER_STEPS),
      });
    } catch (err) {
      lastError = new Error(
        `Workflow builder call failed (attempt ${attempt}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      priorErrors = lastError.message;
      continue;
    }

    if (!state.meta) {
      lastError = new Error(`Builder finished without calling set_metadata (attempt ${attempt}).`);
      priorErrors = lastError.message;
      continue;
    }
    if (state.nodes.length === 0) {
      lastError = new Error(`Builder finished without adding any nodes (attempt ${attempt}).`);
      priorErrors = lastError.message;
      continue;
    }

    const assembled = {
      kind: state.meta.kind,
      schemaVersion: 1,
      metadata: {
        title: state.meta.title,
        description: state.meta.description,
        notes: state.meta.notes,
      },
      settings: DEFAULT_WORKFLOW_SETTINGS,
      nodes: state.nodes,
      connections: state.connections,
      variables: {},
      staticData: null,
      ...(state.meta.kind === "code" && state.meta.entrypointNodeId
        ? { entrypointNodeId: state.meta.entrypointNodeId }
        : {}),
    };

    const result = workflowDocumentSchema.safeParse(assembled);
    if (result.success) return result.data;

    lastError = new Error(
      `Assembled workflow failed schema validation (attempt ${attempt}):\n${summarizeZodIssues(
        result.error,
      )}`,
    );
    priorErrors = summarizeZodIssues(result.error);
  }

  throw lastError ?? new Error("Workflow builder failed for unknown reasons");
}

const { workflows, workflowVersions, chats } = schema;

const DOCUMENT_BUILDER_MODEL = "claude-sonnet-4-5";

export interface WorkflowCommitDeps {
  readonly db: Database;
  readonly userId: string;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly builderModel?: string;
}

export type WorkflowCommitResult =
  | {
      readonly ok: true;
      readonly workflowId: string;
      readonly workflowVersionId: string;
      readonly versionNumber: number;
      readonly title: string;
      readonly kind: WorkflowDocumentInput["kind"];
    }
  | { readonly ok: false; readonly error: string };

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
      let document: WorkflowDocumentInput;
      try {
        document = await buildWorkflowDocument(deps.builderModel ?? DOCUMENT_BUILDER_MODEL, intent);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[workflow_commit] builder failed:", message);
        return { ok: false, error: message.slice(0, 800) };
      }

      const workflowId = randomUUID();
      const versionId = randomUUID();
      const checksum = checksumDocument(document);

      try {
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
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[workflow_commit] persistence failed:", message);
        return { ok: false, error: `Persistence failed: ${message.slice(0, 600)}` };
      }

      return {
        ok: true,
        workflowId,
        workflowVersionId: versionId,
        versionNumber: 1,
        title: document.metadata.title,
        kind: document.kind,
      };
    },
  });
}
