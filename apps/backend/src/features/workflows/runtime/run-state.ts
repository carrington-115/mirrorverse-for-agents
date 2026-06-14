import type { JsonValue } from "@mirrorverse/types";

// Max serialized bytes per node output before we truncate to avoid memory bloat.
const MAX_OUTPUT_BYTES = 256 * 1024; // 256 KB

// A single property-access token: `.foo`, `["some key"]`, `['some key']`, or `[0]`.
const PATH_TOKEN = `(?:\\.[a-zA-Z_$][\\w$]*|\\["[^"]*"\\]|\\['[^']*'\\]|\\[\\d+\\])`;
// A property-access path: zero or more tokens, e.g. `.foo[0]["bar"]`.
const PATH = `(?:${PATH_TOKEN})*`;
const PATH_TOKEN_RE = new RegExp(PATH_TOKEN, "g");

// {{ $json.some.path }}, {{ $json["key"] }}, or {{ $json.items[0].name }} — refers to this node's input.
const JSON_EXPR_RE = new RegExp(`\\{\\{\\s*\\$json(${PATH})\\s*\\}\\}`, "g");
const JSON_EXPR_SINGLE_RE = new RegExp(
  `^\\{\\{\\s*\\$json(${PATH})\\s*\\}\\}$`,
);

// {{ $env.VAR_NAME }} — workspace environment variable.
const ENV_EXPR_RE = /\{\{\s*\$env\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

// {{ $('nodeId').item.json.some.path }} or {{ $('nodeId').item.json.items[0] }} — refers to a named node's output.
const NODE_REF_RE = new RegExp(
  `\\{\\{\\s*\\$\\(\\s*(['"])([^'"]+)\\1\\s*\\)\\.item\\.json(${PATH})\\s*\\}\\}`,
  "g",
);
const NODE_REF_SINGLE_RE = new RegExp(
  `^\\{\\{\\s*\\$\\(\\s*(['"])([^'"]+)\\1\\s*\\)\\.item\\.json(${PATH})\\s*\\}\\}$`,
);

// Any `{{ ... }}` block left after the patterns above have been applied —
// an expression form the runtime doesn't support (e.g. method calls, arithmetic).
const UNRESOLVED_EXPR_RE = /\{\{[^{}]*\}\}/g;

// Extracts the key from a single path token: `.foo` -> "foo", `["foo"]` / `['foo']` -> "foo",
// `[0]` -> "0" (numeric string keys index arrays the same as numbers in JS).
function tokenKey(token: string): string {
  if (token.startsWith(".")) return token.slice(1);
  const inner = token.slice(1, -1);
  return /^\d+$/.test(inner) ? inner : inner.slice(1, -1);
}

function getPath(obj: unknown, path: string): unknown {
  if (path === "") return obj;
  let cur: unknown = obj;
  for (const token of path.match(PATH_TOKEN_RE) ?? []) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[tokenKey(token)];
  }
  return cur;
}

/**
 * Accumulates per-node outputs for a single run.
 *
 * Provides template-expression resolution against:
 *  - `{{ $json.x }}` — the immediate upstream node's output
 *  - `{{ $('nodeId').item.json.x }}` — any node's output by id
 *  - `{{ $env.X }}` — workspace environment variables
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

  private resolveValue(value: unknown, upstreamOutput: JsonValue): unknown {
    if (typeof value === "string") {
      // If the whole string is a single $json expression, return native type.
      const jsonSingle = value.match(JSON_EXPR_SINGLE_RE);
      if (jsonSingle) return getPath(upstreamOutput, jsonSingle[1] ?? "");

      // If the whole string is a single node-reference expression, return native type.
      const nodeRefSingle = value.match(NODE_REF_SINGLE_RE);
      if (nodeRefSingle) {
        return this.resolveNodeRef(nodeRefSingle[2]!, nodeRefSingle[3] ?? "");
      }

      // Otherwise replace all recognized expressions inline (string output).
      let resolved = value
        .replace(JSON_EXPR_RE, (_full, path: string) => {
          const resolvedValue = getPath(upstreamOutput, path);
          return resolvedValue == null ? "" : String(resolvedValue);
        })
        .replace(
          NODE_REF_RE,
          (_full, _quote: string, nodeId: string, path: string) => {
            const resolvedValue = this.resolveNodeRef(nodeId, path);
            return resolvedValue == null ? "" : String(resolvedValue);
          },
        )
        .replace(ENV_EXPR_RE, (_full, name: string) => this.env[name] ?? "");

      // Anything still in `{{ ... }}` form is an unsupported expression —
      // strip it rather than leaking the raw template into output, and
      // surface a warning so it shows up in the run's step logs.
      resolved = resolved.replace(UNRESOLVED_EXPR_RE, (full) => {
        this.warnings.add(`Unresolved template expression: ${full}`);
        return "";
      });

      return resolved;
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
