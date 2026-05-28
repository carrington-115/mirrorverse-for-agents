import type { JsonValue } from "@mirrorverse/types";
import type { WorkflowNode } from "@mirrorverse/types";
import type { InterpretResult } from "./types";

/**
 * core.code stub. E2B sandbox execution is tracked in a separate issue.
 * Returns a failed result so the run step records the gap without crashing
 * the rest of the walker.
 */
export function interpretCode(
  _node: WorkflowNode,
  _input: JsonValue,
): InterpretResult {
  throw new Error(
    "core.code: sandbox execution is not yet implemented in the automation runtime",
  );
}
