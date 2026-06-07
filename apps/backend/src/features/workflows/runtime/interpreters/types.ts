import type { CostBreakdown, JsonValue, RunStepLog } from "@mirrorverse/types";
import type { Database } from "@mirrorverse/db";
import type { CostTracker } from "../cost-tracker";

export interface InterpretResult {
  /** The data output of this node, passed to downstream nodes as $json. */
  readonly output: JsonValue;
  /**
   * Which output ports this execution chose. Typically `["main"]`. Branch
   * nodes return the chosen branch: `["true"]` / `["false"]` for flow.if,
   * or a stringified output index for flow.switch.
   */
  readonly nextPorts: readonly string[];
  /** Optional cost incurred (LLM calls, tool calls). */
  readonly cost?: CostBreakdown;
  /** Optional structured log entries emitted during interpretation. */
  readonly logs?: RunStepLog[];
}

/** Context available to every interpreter. */
export interface ExecutionContext {
  readonly db: Database;
  readonly workspaceId: string;
  readonly runId: string;
  readonly costTracker: CostTracker;
  /** Workspace environment variables, keyed by name. Available as {{ $env.NAME }} in templates. */
  readonly env: Readonly<Record<string, string>>;
}
