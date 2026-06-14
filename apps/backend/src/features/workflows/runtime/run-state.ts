import type { JsonValue } from "@mirrorverse/types";

import {
  evaluateOperations,
  getPath,
  parseTemplateExpression,
  type ParsedExpression,
} from "./expression-parser";

// Max serialized bytes per node output before we truncate to avoid memory bloat.
const MAX_OUTPUT_BYTES = 256 * 1024; // 256 KB

// A `{{ ... }}` block that is the entire string (possibly with surrounding whitespace) —
// resolves to the expression's native type rather than a string.
const SINGLE_EXPR_RE = /^\{\{\s*([\s\S]+?)\s*\}\}$/;
// Any `{{ ... }}` block, for inline (string-interpolation) replacement.
const INLINE_EXPR_RE = /\{\{([^{}]*)\}\}/g;

/**
 * Accumulates per-node outputs for a single run.
 *
 * Provides template-expression resolution against:
 *  - `{{ $json.x }}` — the immediate upstream node's output
 *  - `{{ $('nodeId').item.json.x }}` — any node's output by id
 *  - `{{ $env.X }}` — workspace environment variables
 *
 * Both forms above also support a chained whitelist of operations
 * (e.g. `.split(',')[0].trim()`) — see `expression-parser.ts`.
 */
export class RunState {
  private readonly outputs = new Map<string, JsonValue>();
  private readonly env: Readonly<Record<string, string>>;
  private readonly warnings = new Set<string>();

  constructor(env: Record<string, string> = {}) {
    this.env = env;
  }

  set(nodeId: string, output: JsonValue): void {
    const serialized = JSON.stringify(output ?? null);
    if (serialized.length > MAX_OUTPUT_BYTES) {
      // Truncate to a string pointer rather than storing a huge blob.
      this.outputs.set(nodeId, {
        _truncated: true,
        byteLength: serialized.length,
        preview: serialized.slice(0, 500),
      });
    } else {
      this.outputs.set(nodeId, output ?? null);
    }
  }

  get(nodeId: string): JsonValue | undefined {
    return this.outputs.get(nodeId);
  }

  /**
   * Resolve template expressions in `params` against `upstreamOutput`.
   * Non-string values (numbers, booleans, null) pass through unchanged.
   */
  resolveParams(
    params: Readonly<Record<string, unknown>>,
    upstreamOutput: JsonValue,
  ): Record<string, unknown> {
    return this.resolveValue(params, upstreamOutput) as Record<string, unknown>;
  }

  /**
   * Returns and clears any warnings (e.g. unresolved `{{ }}` expressions or
   * references to unknown nodes) collected since the last call.
   */
  drainWarnings(): string[] {
    if (this.warnings.size === 0) return [];
    const out = [...this.warnings];
    this.warnings.clear();
    return out;
  }

  private resolveNodeRef(nodeId: string, path: string): unknown {
    if (!this.outputs.has(nodeId)) {
      this.warnings.add(
        `Template references unknown or not-yet-executed node "${nodeId}"`,
      );
      return undefined;
    }
    return getPath(this.outputs.get(nodeId) ?? null, path);
  }

  private evaluateParsed(
    parsed: ParsedExpression,
    upstreamOutput: JsonValue,
  ): unknown {
    if (parsed.root.kind === "env") return this.env[parsed.root.name] ?? "";
    const base =
      parsed.root.kind === "json"
        ? getPath(upstreamOutput, parsed.path)
        : this.resolveNodeRef(parsed.root.nodeId, parsed.path);
    return evaluateOperations(base, parsed.ops);
  }

  private resolveValue(value: unknown, upstreamOutput: JsonValue): unknown {
    if (typeof value === "string") {
      // If the whole string is a single `{{ ... }}` expression, return native type.
      const singleMatch = value.match(SINGLE_EXPR_RE);
      if (singleMatch) {
        const parsed = parseTemplateExpression(singleMatch[1]!);
        if (parsed) return this.evaluateParsed(parsed, upstreamOutput);
      }

      // Otherwise replace all recognized expressions inline (string output).
      return value.replace(INLINE_EXPR_RE, (full, inner: string) => {
        const parsed = parseTemplateExpression(inner.trim());
        if (!parsed) {
          // Unsupported/leftover `{{ ... }}` — strip it rather than leaking the raw
          // template into output, and surface a warning so it shows up in the
          // run's step logs.
          this.warnings.add(`Unresolved template expression: ${full}`);
          return "";
        }
        const result = this.evaluateParsed(parsed, upstreamOutput);
        return result == null ? "" : String(result);
      });
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.resolveValue(item, upstreamOutput));
    }
    if (value !== null && typeof value === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[k] = this.resolveValue(v, upstreamOutput);
      }
      return out;
    }
    return value;
  }
}
