import type { JsonValue } from "@mirrorverse/types";
import type { WorkflowNode } from "@mirrorverse/types";
import type { GetStepTools } from "inngest";
import type { RunState } from "../run-state.js";

import { inngest } from "../../../inngest/client.js";

type StepTools = GetStepTools<typeof inngest>;
import type { InterpretResult } from "./types.js";

// ─── Condition evaluation (flow.if) ───────────────────────────────────────────

type Operator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "greater_than_or_equal"
  | "less_than_or_equal"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty";

interface Condition {
  readonly leftValue: unknown;
  readonly operator: Operator;
  readonly rightValue?: unknown;
}

function evalCondition(cond: Condition): boolean {
  const l = cond.leftValue;
  const r = cond.rightValue;
  switch (cond.operator) {
    case "equals":
      return l == r; // intentional loose equality for string/number coercion
    case "not_equals":
      return l != r;
    case "greater_than":
      return Number(l) > Number(r);
    case "less_than":
      return Number(l) < Number(r);
    case "greater_than_or_equal":
      return Number(l) >= Number(r);
    case "less_than_or_equal":
      return Number(l) <= Number(r);
    case "contains":
      return String(l).includes(String(r));
    case "not_contains":
      return !String(l).includes(String(r));
    case "is_empty":
      return l == null || l === "" || (Array.isArray(l) && l.length === 0);
    case "is_not_empty":
      return l != null && l !== "" && !(Array.isArray(l) && l.length === 0);
    default:
      return false;
  }
}

interface IfParams {
  readonly conditions?: Condition[];
  readonly combinator?: "and" | "or";
}

// ─── Switch ───────────────────────────────────────────────────────────────────

interface SwitchCase {
  readonly conditions: Condition[];
  readonly combinator?: "and" | "or";
  readonly outputIndex: number;
}

interface SwitchParams {
  readonly cases?: SwitchCase[];
  readonly defaultOutputIndex?: number;
}

// ─── Loop (signal only) ───────────────────────────────────────────────────────

// String constants (not Symbols) so they survive Inngest step JSON checkpointing.
export const LOOP_SIGNAL = "__loop__" as const;

export interface LoopSignal {
  readonly kind: typeof LOOP_SIGNAL;
  readonly items: JsonValue[];
}

interface LoopParams {
  readonly mode?: "for_each";
  readonly iterableExpression?: string;
  readonly batchSize?: number;
}

// ─── Filter ───────────────────────────────────────────────────────────────────

// ─── Wait ─────────────────────────────────────────────────────────────────────

interface WaitUntilDuration {
  readonly mode: "duration";
  readonly ms: number;
}

interface WaitParams {
  readonly until?: WaitUntilDuration;
}

// ─── Interpreters ─────────────────────────────────────────────────────────────

export function interpretFlowIf(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
): InterpretResult {
  const params = state.resolveParams(node.params, input) as IfParams;
  const conditions = params.conditions ?? [];
  const combinator = params.combinator ?? "and";

  const results = conditions.map((c) => evalCondition(c));
  const passed =
    combinator === "and" ? results.every(Boolean) : results.some(Boolean);

  return { output: input, nextPorts: [passed ? "true" : "false"] };
}

export function interpretFlowSwitch(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
): InterpretResult {
  const params = state.resolveParams(node.params, input) as SwitchParams;
  const cases = params.cases ?? [];
  const defaultIndex = params.defaultOutputIndex ?? 0;

  for (const switchCase of cases) {
    const combinator = switchCase.combinator ?? "and";
    const results = (switchCase.conditions ?? []).map((c) => {
      const left = state.resolveParams({ v: c.leftValue }, input);
      const right =
        c.rightValue !== undefined
          ? state.resolveParams({ v: c.rightValue }, input)
          : {};
      return evalCondition({ ...c, leftValue: left.v, rightValue: right.v });
    });
    const passed =
      combinator === "and" ? results.every(Boolean) : results.some(Boolean);
    if (passed) {
      return { output: input, nextPorts: [String(switchCase.outputIndex)] };
    }
  }

  return { output: input, nextPorts: [String(defaultIndex)] };
}

/**
 * flow.loop returns a LoopSignal so the graph walker knows to iterate.
 * The walker handles the actual looping; this just extracts the iterable.
 */
export function interpretFlowLoop(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
): LoopSignal {
  const params = state.resolveParams(node.params, input) as LoopParams;
  const expr = params.iterableExpression ?? "{{ $json }}";

  const resolved = state.resolveParams({ iterable: expr }, input);
  const raw = resolved.iterable;
  const items = Array.isArray(raw) ? (raw as JsonValue[]) : [raw as JsonValue];

  return { kind: LOOP_SIGNAL, items };
}

export function interpretFlowFilter(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
): InterpretResult {
  const params = state.resolveParams(node.params, input) as IfParams;
  const conditions = params.conditions ?? [];
  const combinator = params.combinator ?? "and";

  const arr = Array.isArray(input) ? input : [input];
  const filtered = arr.filter((item) => {
    const resolvedConditions = conditions.map((c) => {
      const leftResolved = state.resolveParams(
        { v: c.leftValue },
        item as JsonValue,
      );
      const rightResolved =
        c.rightValue !== undefined
          ? state.resolveParams({ v: c.rightValue }, item as JsonValue)
          : {};
      return evalCondition({
        ...c,
        leftValue: leftResolved.v,
        rightValue: rightResolved.v,
      });
    });
    return combinator === "and"
      ? resolvedConditions.every(Boolean)
      : resolvedConditions.some(Boolean);
  });

  return { output: filtered as JsonValue, nextPorts: ["main"] };
}

export function interpretFlowMerge(
  _node: WorkflowNode,
  input: JsonValue,
): InterpretResult {
  // The walker collects all branch outputs; this just passes the accumulated
  // input (already merged by the walker) through to downstream nodes.
  return { output: input, nextPorts: ["main"] };
}

export function interpretFlowNoop(
  _node: WorkflowNode,
  input: JsonValue,
): InterpretResult {
  return { output: input, nextPorts: ["main"] };
}

/** flow.stop — signals the walker to halt execution. */
export const STOP_SIGNAL = "__stop__" as const;
export type StopSignal = typeof STOP_SIGNAL;

export function interpretFlowStop(): StopSignal {
  return STOP_SIGNAL;
}

export async function interpretFlowWait(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
  step: StepTools,
): Promise<InterpretResult> {
  const params = state.resolveParams(node.params, input) as WaitParams;
  const until = params.until;

  if (until?.mode === "duration" && typeof until.ms === "number") {
    await step.sleep(`wait:${node.id}`, until.ms);
  }
  // Event-based wait is deferred; duration wait is the only supported mode.

  return { output: input, nextPorts: ["main"] };
}
