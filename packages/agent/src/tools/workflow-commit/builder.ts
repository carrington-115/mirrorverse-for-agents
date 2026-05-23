import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import { resolveModel } from "../../models/resolve";
import {
  jsonObject,
  workflowConnection,
  workflowDocumentSchema,
  workflowNode,
  type WorkflowDocumentInput,
} from "../../schemas/workflow";
import { WORKFLOW_DOCUMENT_BUILDER_PROMPT } from "../../system-prompt";
import { summarizeZodIssues } from "../_shared/zod-errors";

import {
  DEFAULT_WORKFLOW_SETTINGS,
  MAX_BUILDER_ATTEMPTS,
  MAX_BUILDER_STEPS,
  MAX_TITLE_LENGTH,
  WORKFLOW_DOCUMENT_SCHEMA_VERSION,
  WORKFLOW_KINDS,
} from "./constants";
import type { BuilderState, WorkflowCommitProgressEmitter } from "./types";

const narration = z
  .string()
  .min(1)
  .max(280)
  .describe(
    "One short sentence in plain conversational English, addressed to the end user, explaining what you are about to do. No jargon, no JSON, no internal kind names like trigger.chat_message. Example: 'Let me set up a Slack listener so customers can message you directly.'",
  );

function makeBuilderTools(state: BuilderState, onProgress?: WorkflowCommitProgressEmitter) {
  return {
    set_metadata: tool({
      description:
        "Set the workflow kind and metadata. Call exactly once, before adding nodes. For kind 'code', also pass entrypointNodeId (the id of the node execution starts from). Always include a one-sentence `narration` describing what you are doing for the end user.",
      inputSchema: z.object({
        kind: z.enum(WORKFLOW_KINDS),
        title: z.string().min(1).max(MAX_TITLE_LENGTH),
        description: z.string().nullish(),
        notes: z.string().nullish(),
        entrypointNodeId: z.string().nullish(),
        narration,
      }),
      execute: ({ kind, title, description, notes, entrypointNodeId, narration: msg }) => {
        state.meta = {
          kind,
          title,
          description: description ?? null,
          notes: notes ?? null,
          entrypointNodeId: entrypointNodeId ?? null,
        };
        onProgress?.(msg);
        return { ok: true as const };
      },
    }),
    add_node: tool({
      description:
        "Add one workflow node. `node` is a complete node object matching the node-kind schema in the system prompt. Always include a one-sentence `narration` describing what this node does for the end user. Returns { ok: false, error } when the node is invalid; read the error and call add_node again with a corrected node.",
      inputSchema: z.object({ node: jsonObject, narration }),
      execute: ({ node, narration: msg }) => {
        const parsed = workflowNode.safeParse(node);
        if (!parsed.success) {
          return { ok: false as const, error: summarizeZodIssues(parsed.error) };
        }
        if (state.nodes.some((n) => n.id === parsed.data.id)) {
          return { ok: false as const, error: `Duplicate node id "${parsed.data.id}".` };
        }
        state.nodes.push(parsed.data);
        onProgress?.(msg);
        return { ok: true as const, nodeId: parsed.data.id };
      },
    }),
    add_connection: tool({
      description:
        "Add one edge between two already-added nodes. `connection` matches the connection schema. Always include a one-sentence `narration` describing the wiring for the end user. Returns { ok: false, error } when invalid; fix and call again.",
      inputSchema: z.object({ connection: jsonObject, narration }),
      execute: ({ connection, narration: msg }) => {
        const parsed = workflowConnection.safeParse(connection);
        if (!parsed.success) {
          return { ok: false as const, error: summarizeZodIssues(parsed.error) };
        }
        const ids = new Set(state.nodes.map((n) => n.id));
        if (!ids.has(parsed.data.fromNodeId)) {
          return {
            ok: false as const,
            error: `fromNodeId "${parsed.data.fromNodeId}" has no matching node; add that node first.`,
          };
        }
        if (!ids.has(parsed.data.toNodeId)) {
          return {
            ok: false as const,
            error: `toNodeId "${parsed.data.toNodeId}" has no matching node; add that node first.`,
          };
        }
        state.connections.push(parsed.data);
        onProgress?.(msg);
        return { ok: true as const };
      },
    }),
  };
}

function parseIdList(captured: string): string[] {
  return captured
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter((s) => s.length > 0);
}

// The builder model is told to write knowledge base ids into the intent as
// `knowledgeBaseIds: [<id>]`. Pull them back out deterministically so retrieval
// doesn't depend on the model remembering to copy them onto the voice node.
export function extractKnowledgeBaseIds(intent: string): string[] {
  const m = intent.match(/knowledge[_\s]*base[_\s]*ids?\s*[:=]\s*\[([^\]]*)\]/i);
  return m?.[1] ? parseIdList(m[1]) : [];
}

// Optional per-document scoping, written as `knowledgeDocumentIds: [<id>]`. The
// `document` token keeps this disjoint from the `base` token above, so the two
// markers can never capture each other.
export function extractKnowledgeDocumentIds(intent: string): string[] {
  const m = intent.match(/knowledge[_\s]*document[_\s]*ids?\s*[:=]\s*\[([^\]]*)\]/i);
  return m?.[1] ? parseIdList(m[1]) : [];
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

// Reconciliation: if the intent supplied knowledge base id(s) but the builder
// didn't put them (or put different ones) on the voice agent node, set them
// from the intent so the deployed agent searches the right KBs. The optional
// document-scoping ids are reconciled the same way, but only alongside KB ids
// (document scoping is meaningless without a bound knowledge base, and the
// compiler's RAG gate keys off knowledgeBaseIds).
function reconcileVoiceKnowledgeBases(intent: string, state: BuilderState): void {
  const kbIds = extractKnowledgeBaseIds(intent);
  if (kbIds.length === 0) return;
  const docIds = extractKnowledgeDocumentIds(intent);
  for (const node of state.nodes) {
    if (node.kind !== "ai.voice_agent") continue;
    if (!sameIds(node.knowledgeBaseIds ?? [], kbIds)) {
      node.knowledgeBaseIds = kbIds;
    }
    if (!sameIds(node.knowledgeDocumentIds ?? [], docIds)) {
      node.knowledgeDocumentIds = docIds;
    }
  }
}

function assembleDocument(state: BuilderState) {
  if (!state.meta) return null;
  return {
    kind: state.meta.kind,
    schemaVersion: WORKFLOW_DOCUMENT_SCHEMA_VERSION,
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
}

export interface BuildWorkflowOptions {
  readonly existingDocument?: WorkflowDocumentInput | null;
}

export async function buildWorkflowDocument(
  modelId: string,
  intent: string,
  onProgress?: WorkflowCommitProgressEmitter,
  options?: BuildWorkflowOptions,
): Promise<WorkflowDocumentInput> {
  let lastError: Error | null = null;
  let priorErrors: string | null = null;

  const editContext = options?.existingDocument
    ? `\n\nThe user is EDITING an existing workflow. The current workflow document is below. Apply the changes described in the intent and rebuild the full workflow from scratch using the build tools. Keep parts the user did not ask to change. Reuse the same node ids where it makes sense so connections stay consistent.\n\nCurrent workflow:\n\`\`\`json\n${JSON.stringify(
        options.existingDocument,
        null,
        2,
      )}\n\`\`\``
    : "";

  for (let attempt = 1; attempt <= MAX_BUILDER_ATTEMPTS; attempt++) {
    const state: BuilderState = { meta: null, nodes: [], connections: [] };

    const repairContext = priorErrors
      ? `\n\nYour previous attempt produced an invalid workflow. The validator reported:\n${priorErrors}\n\nBuild it again from scratch and resolve every issue. Keep the same intent.`
      : "";

    try {
      await generateText({
        model: resolveModel(modelId),
        system: WORKFLOW_DOCUMENT_BUILDER_PROMPT,
        prompt: intent + editContext + repairContext,
        tools: makeBuilderTools(state, onProgress),
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

    reconcileVoiceKnowledgeBases(intent, state);

    const assembled = assembleDocument(state);
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
