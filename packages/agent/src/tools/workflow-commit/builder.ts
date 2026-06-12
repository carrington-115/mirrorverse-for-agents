import { generateText, stepCountIs, tool } from "ai";
import { z } from "zod";

import { resolveModel } from "../../models/resolve";
import {
  jsonObject,
  workflowConnection,
  workflowDocumentSchema,
  workflowNode,
  type WorkflowDocumentInput,
  type WorkflowNodeInput,
} from "../../schemas/workflow";
import { WORKFLOW_DOCUMENT_BUILDER_PROMPT } from "../../system-prompt";
import { summarizeZodIssues } from "../_shared/zod-errors";

import { MAX_BUILDER_ATTEMPTS, MAX_BUILDER_STEPS, MAX_TITLE_LENGTH } from "./constants";
import type { BuilderState, WorkflowCommitProgressEmitter } from "./types";
import type { WorkflowKind } from "./constants";

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
        "Set the workflow kind and title. Call exactly once, before adding nodes. Always include a one-sentence `narration` describing what you are doing for the end user.",
      inputSchema: z
        .object({
          kind: z.enum(["automation", "voice-agent", "chat-agent", "code"]),
          title: z.string().min(1).max(MAX_TITLE_LENGTH),
          description: z.string().nullish(),
          notes: z.string().nullish(),
          narration,
        })
        .strict(),
      execute: ({ kind, title, description, notes, narration: msg }) => {
        state.meta = {
          kind,
          title,
          description: description ?? null,
          notes: notes ?? null,
        };
        onProgress?.(msg);
        return { ok: true as const };
      },
    }),
    add_node: tool({
      description:
        "Add one workflow node. `node` must have: `id` (unique string), `type` (the node kind, e.g. `trigger.webhook`), `position: { x, y }`, and `params` (an object with all kind-specific configuration). Always include a one-sentence `narration`. Returns { ok: false, error } when the node is invalid; read the error and call add_node again with a corrected node.",
      inputSchema: z.object({ node: jsonObject, narration }).strict(),
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
        "Add one edge between two already-added nodes. `connection` must have: `from` (source node id), `fromPort` (port name, e.g. 'main'), `to` (target node id), `toPort` (port name). Always include a one-sentence `narration`. Returns { ok: false, error } when invalid; fix and call again.",
      inputSchema: z.object({ connection: jsonObject, narration }).strict(),
      execute: ({ connection, narration: msg }) => {
        const parsed = workflowConnection.safeParse(connection);
        if (!parsed.success) {
          return { ok: false as const, error: summarizeZodIssues(parsed.error) };
        }
        const ids = new Set(state.nodes.map((n) => n.id));
        if (!ids.has(parsed.data.from)) {
          return {
            ok: false as const,
            error: `from "${parsed.data.from}" has no matching node; add that node first.`,
          };
        }
        if (!ids.has(parsed.data.to)) {
          return {
            ok: false as const,
            error: `to "${parsed.data.to}" has no matching node; add that node first.`,
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

// Optional per-document scoping, written as `knowledgeDocumentIds: [<id>]`.
export function extractKnowledgeDocumentIds(intent: string): string[] {
  const m = intent.match(/knowledge[_\s]*document[_\s]*ids?\s*[:=]\s*\[([^\]]*)\]/i);
  return m?.[1] ? parseIdList(m[1]) : [];
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

// Reconciliation: if the intent supplied knowledge base id(s) but the builder
// didn't put them (or put different ones) on the voice agent node, patch them.
function reconcileVoiceKnowledgeBases(intent: string, state: BuilderState): void {
  const kbIds = extractKnowledgeBaseIds(intent);
  if (kbIds.length === 0) return;
  const docIds = extractKnowledgeDocumentIds(intent);
  for (let i = 0; i < state.nodes.length; i++) {
    const node = state.nodes[i];
    if (node.type !== "ai.voice_agent") continue;
    const currentKbIds = Array.isArray(node.params.knowledgeBaseIds)
      ? (node.params.knowledgeBaseIds as string[])
      : [];
    const currentDocIds = Array.isArray(node.params.knowledgeDocumentIds)
      ? (node.params.knowledgeDocumentIds as string[])
      : [];
    if (!sameIds(currentKbIds, kbIds) || !sameIds(currentDocIds, docIds)) {
      state.nodes[i] = {
        ...node,
        params: { ...node.params, knowledgeBaseIds: kbIds, knowledgeDocumentIds: docIds },
      };
    }
  }
}

// Types that legitimately have no connections: annotation notes and self-contained voice agents
const STANDALONE_NODE_TYPES = new Set(["editor.sticky_note", "ai.voice_agent"]);

// Groups nodes into connected components via undirected traversal of `connections`,
// treating `from`/`to` as an edge regardless of port name (so AI-slot wiring like
// lm_1 --ai_languageModel--> agent_1 links those nodes together too).
function findConnectedComponents(
  nodes: readonly WorkflowNodeInput[],
  connections: readonly { from: string; to: string }[],
): WorkflowNodeInput[][] {
  const adjacency = new Map<string, Set<string>>();
  for (const n of nodes) adjacency.set(n.id, new Set());
  for (const c of connections) {
    adjacency.get(c.from)?.add(c.to);
    adjacency.get(c.to)?.add(c.from);
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const components: WorkflowNodeInput[][] = [];
  for (const node of nodes) {
    if (visited.has(node.id)) continue;
    const component: WorkflowNodeInput[] = [];
    const stack = [node.id];
    visited.add(node.id);
    while (stack.length > 0) {
      const id = stack.pop()!;
      const found = byId.get(id);
      if (found) component.push(found);
      for (const next of adjacency.get(id) ?? []) {
        if (!visited.has(next)) {
          visited.add(next);
          stack.push(next);
        }
      }
    }
    components.push(component);
  }
  return components;
}

// Returns a list of human-readable problems, or empty array if the graph looks complete.
function checkGraphCompleteness(state: BuilderState): string[] {
  const problems: string[] = [];
  const connectedIds = new Set<string>();
  for (const c of state.connections) {
    connectedIds.add(c.from);
    connectedIds.add(c.to);
  }

  const relevant = state.nodes.filter((n) => !STANDALONE_NODE_TYPES.has(n.type));

  const isolated = relevant.filter((n) => !connectedIds.has(n.id));
  if (isolated.length > 0) {
    problems.push(
      `Isolated nodes (no connections): ${isolated.map((n) => `${n.id} (${n.type})`).join(", ")}. ` +
        `Every non-annotation node must be wired into the graph.`,
    );
  }

  // Among nodes that DO have connections, make sure they all form a single
  // connected group. Two nodes wired only to each other still pass the check
  // above but can be an "island" disconnected from the main flow.
  const wired = relevant.filter((n) => connectedIds.has(n.id));
  if (wired.length > 1) {
    const wiredIds = new Set(wired.map((n) => n.id));
    const internalConnections = state.connections.filter(
      (c) => wiredIds.has(c.from) && wiredIds.has(c.to),
    );
    const components = findConnectedComponents(wired, internalConnections);
    if (components.length > 1) {
      const main =
        components.find((c) => c.some((n) => n.type.startsWith("trigger."))) ??
        components.reduce((a, b) => (a.length >= b.length ? a : b));
      for (const component of components) {
        if (component === main) continue;
        problems.push(
          `Disconnected group of nodes (not wired to the main flow): ${component
            .map((n) => `${n.id} (${n.type})`)
            .join(
              ", ",
            )}. Connect this group into the main flow with a connection, or remove these nodes.`,
        );
      }
    }
  }

  return problems;
}

function assembleDocument(
  state: BuilderState,
): Omit<WorkflowDocumentInput, "id" | "version"> | null {
  if (!state.meta) return null;
  return {
    name: state.meta.title,
    nodes: state.nodes,
    connections: state.connections,
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
): Promise<{ document: WorkflowDocumentInput; kind: WorkflowKind }> {
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
        temperature: 0,
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

    const completenessProblems = checkGraphCompleteness(state);
    if (completenessProblems.length > 0) {
      const msg = `Workflow graph is incomplete (attempt ${attempt}):\n${completenessProblems.join("\n")}`;
      lastError = new Error(msg);
      priorErrors = msg;
      continue;
    }

    const assembled = assembleDocument(state);
    const result = workflowDocumentSchema.safeParse(assembled);
    if (result.success) {
      return { document: result.data, kind: state.meta.kind };
    }

    lastError = new Error(
      `Assembled workflow failed schema validation (attempt ${attempt}):\n${summarizeZodIssues(
        result.error,
      )}`,
    );
    priorErrors = summarizeZodIssues(result.error);
  }

  throw lastError ?? new Error("Workflow builder failed for unknown reasons");
}
