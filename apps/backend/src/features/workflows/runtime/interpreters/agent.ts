import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai as aiOpenai } from "@ai-sdk/openai";
import { schema, type Database } from "@mirrorverse/db";
import type {
  JsonValue,
  WorkflowNode,
  WorkflowDocument,
} from "@mirrorverse/types";

import { filterKbIdsByWorkspace } from "../../../knowledge/repo";
import { searchAcrossKnowledgeBases } from "../../../knowledge/search";

import type { CostTracker } from "../cost-tracker";
import type { RunState } from "../run-state";
import type { InterpretResult } from "./types";

const { usageEvents } = schema;

interface LanguageModelParams {
  readonly provider?: string;
  readonly model?: string;
  readonly temperature?: number;
  readonly maxOutputTokens?: number;
  readonly maxTokens?: number; // legacy alias — emitted by older builder versions
}

interface RetrieverParams {
  readonly knowledgeBaseId?: string;
  readonly topK?: number;
  readonly minScore?: number | null;
}

interface AgentParams {
  readonly systemPrompt?: string;
  readonly userPromptTemplate?: string;
  readonly outputMode?: string;
}

function resolveModel(params: LanguageModelParams) {
  const provider = params.provider ?? "anthropic";
  const modelId = params.model ?? "claude-haiku-4-5";
  if (provider === "openai") return aiOpenai(modelId);
  // Default to Anthropic for all other providers.
  return anthropic(modelId);
}

function findSlotNode(
  doc: WorkflowDocument,
  agentNodeId: string,
  slotName: string,
): WorkflowNode | null {
  const conn = doc.connections.find(
    (c) => c.to === agentNodeId && c.toPort === slotName,
  );
  if (!conn) return null;
  return doc.nodes.find((n) => n.id === conn.from) ?? null;
}

export async function interpretAgent(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
  doc: WorkflowDocument,
  workspaceId: string,
  runId: string,
  db: Database,
  costTracker: CostTracker,
): Promise<InterpretResult> {
  const params = state.resolveParams(node.params, input) as AgentParams;

  // Resolve the wired language model node, or fall back to a default.
  const lmNode = findSlotNode(doc, node.id, "ai_languageModel");
  const rawLmParams = lmNode ? (lmNode.params as Record<string, unknown>) : {};
  const lmParams: LanguageModelParams = {
    provider: (rawLmParams.provider as string | undefined) ?? "anthropic",
    model: (rawLmParams.model as string | undefined) ?? "claude-haiku-4-5",
    temperature: (rawLmParams.temperature as number | undefined) ?? 0.7,
    // Accept both field names; maxOutputTokens wins if both are present.
    maxOutputTokens:
      (rawLmParams.maxOutputTokens as number | undefined) ??
      (rawLmParams.maxTokens as number | undefined) ??
      1024,
  };

  const model = resolveModel(lmParams);
  const systemPrompt = params.systemPrompt ?? "You are a helpful assistant.";
  const userTemplate = params.userPromptTemplate ?? "{{ $json }}";

  // Resolve the user prompt template against the node's input.
  const resolved = state.resolveParams({ prompt: userTemplate }, input);
  const userPrompt =
    typeof resolved.prompt === "string"
      ? resolved.prompt
      : JSON.stringify(resolved.prompt ?? input);

  // --- Retriever (RAG) slot ---
  const retrieverNode = findSlotNode(doc, node.id, "ai_retriever");
  let ragContext = "";

  if (retrieverNode) {
    const rp = retrieverNode.params as RetrieverParams;
    const kbId = rp.knowledgeBaseId ?? "";
    if (kbId) {
      // Re-validate against the workspace to prevent cross-tenant reads.
      const ownedIds = await filterKbIdsByWorkspace(db, [kbId], workspaceId);
      if (ownedIds.length > 0) {
        const chunks = await searchAcrossKnowledgeBases(
          db,
          ownedIds,
          userPrompt,
          rp.topK ?? 6,
          rp.minScore ?? undefined,
        );
        if (chunks.length > 0) {
          ragContext =
            "\n\n---\nRelevant context:\n" +
            chunks.map((c) => c.content).join("\n\n---\n");
        }
      }
    }
  }

  const effectiveSystemPrompt = ragContext
    ? `${systemPrompt}${ragContext}`
    : systemPrompt;

  const { text, usage } = await generateText({
    model,
    system: effectiveSystemPrompt,
    prompt: userPrompt,
    maxOutputTokens: lmParams.maxOutputTokens ?? 1024,
    temperature: lmParams.temperature ?? 0.7,
  });

  // Record token usage for billing.
  const stepCost = {
    tokensIn: usage?.inputTokens ?? 0,
    tokensInCached: 0,
    tokensOut: usage?.outputTokens ?? 0,
    costCents: 0, // precise pricing resolved at aggregation time
  };
  costTracker.add(stepCost);

  const idempotencyKey = `run:${runId}:node:${node.id}:llm_input`;
  await db
    .insert(usageEvents)
    .values({
      workspaceId,
      runId,
      kind: "llm_input",
      quantity: stepCost.tokensIn,
      unit: "token",
      model: lmParams.model ?? "claude-haiku-4-5",
      costCents: 0,
      idempotencyKey,
    })
    .onConflictDoNothing();

  return {
    output: text as JsonValue,
    nextPorts: ["main"],
    cost: stepCost,
  };
}
