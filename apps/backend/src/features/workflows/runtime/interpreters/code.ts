import type { JsonValue, WorkflowNode } from "@mirrorverse/types";
import { recordSandboxUsage } from "../../../billing/repo";
import {
  runCode,
  computeSandboxCostCents,
  type CodeLanguage,
} from "../../../code/runner";
import { resolvePolicy } from "../../../code/policy";
import type { RunState } from "../run-state";
import type { ExecutionContext, InterpretResult } from "./types";

interface CodeParams {
  readonly language?: unknown;
  readonly source?: unknown;
  readonly inputs?: unknown;
}

export async function interpretCode(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
  ctx: ExecutionContext,
): Promise<InterpretResult> {
  const raw = state.resolveParams(node.params, input) as CodeParams;

  const language = (raw.language ?? "python") as CodeLanguage;
  if (language !== "python" && language !== "typescript") {
    throw new Error(
      `core.code: unsupported language '${String(raw.language)}'`,
    );
  }

  const source = typeof raw.source === "string" ? raw.source : "";
  if (!source.trim()) throw new Error("core.code: source is required");

  const inputs: JsonValue =
    raw.inputs !== undefined ? (raw.inputs as JsonValue) : input;
  const policy = resolvePolicy(node.params as Record<string, unknown>);

  const result = await runCode({ language, source, inputs, policy });

  const sandboxSeconds = Math.max(1, Math.ceil(result.durationMs / 1000));
  const costCents = computeSandboxCostCents(result.durationMs);

  await recordSandboxUsage(ctx.db, {
    workspaceId: ctx.workspaceId,
    runId: ctx.runId,
    nodeId: node.id,
    sandboxSeconds,
    costCents,
  });

  const cost = {
    tokensIn: 0 as const,
    tokensInCached: 0 as const,
    tokensOut: 0 as const,
    costCents,
  };

  const now = new Date();
  const logs = result.stderr
    ? [{ ts: now, level: "warn" as const, message: result.stderr, data: null }]
    : undefined;

  return { output: result.output ?? null, nextPorts: ["main"], cost, logs };
}
