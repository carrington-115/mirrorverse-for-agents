import type { JsonValue } from "@mirrorverse/types";
import type { WorkflowNode } from "@mirrorverse/types";
import type { RunState } from "../run-state";
import type { InterpretResult } from "./types";

interface EditFieldsConfig {
  readonly fields?: Record<string, unknown>;
}

interface RenameKeysConfig {
  readonly mapping?: Record<string, string>;
}

interface AggregateConfig {
  readonly key?: string;
  readonly op?: "sum" | "count" | "min" | "max" | "first" | "last";
}

function isJsonObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function applyEditFields(data: JsonValue, config: EditFieldsConfig): JsonValue {
  const fields = config.fields ?? {};
  if (!isJsonObject(data)) return { ...fields } as JsonValue;
  return { ...(data as Record<string, unknown>), ...fields } as JsonValue;
}

function applyRenameKeys(data: JsonValue, config: RenameKeysConfig): JsonValue {
  const mapping = config.mapping ?? {};
  if (!isJsonObject(data)) return data;
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    result[mapping[k] ?? k] = v;
  }
  return result as JsonValue;
}

function applyAggregate(data: JsonValue, config: AggregateConfig): JsonValue {
  const key = config.key;
  const op = config.op ?? "count";
  const arr = Array.isArray(data) ? data : [data];

  if (op === "count") return arr.length;

  const values = arr.map((item) => {
    if (key && isJsonObject(item))
      return (item as Record<string, unknown>)[key];
    return item;
  });
  const nums = values.map((v) => Number(v)).filter((n) => !Number.isNaN(n));

  switch (op) {
    case "sum":
      return nums.reduce((s, n) => s + n, 0);
    case "min":
      return nums.length > 0 ? Math.min(...nums) : null;
    case "max":
      return nums.length > 0 ? Math.max(...nums) : null;
    case "first":
      return (arr[0] ?? null) as JsonValue;
    case "last":
      return (arr[arr.length - 1] ?? null) as JsonValue;
    default:
      return null;
  }
}

export function interpretTransform(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
): InterpretResult {
  const params = state.resolveParams(node.params, input);
  const op = (params.op as string) ?? "edit_fields";
  const config = (params.config ?? {}) as Record<string, unknown>;

  let output: JsonValue;
  switch (op) {
    case "edit_fields":
      output = applyEditFields(input, config as EditFieldsConfig);
      break;
    case "rename_keys":
      output = applyRenameKeys(input, config as RenameKeysConfig);
      break;
    case "map": {
      // Basic pass-through map; expression evaluation beyond template vars
      // requires a safe evaluator (future work).
      const arr = Array.isArray(input) ? input : [input];
      output = arr as JsonValue;
      break;
    }
    case "aggregate":
      output = applyAggregate(input, config as AggregateConfig) as JsonValue;
      break;
    default:
      output = input;
  }

  return { output, nextPorts: ["main"] };
}
