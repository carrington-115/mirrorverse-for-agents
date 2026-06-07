import type { JsonValue } from "@mirrorverse/types";

// Max serialized bytes per node output before we truncate to avoid memory bloat.
const MAX_OUTPUT_BYTES = 256 * 1024; // 256 KB

// Regex matching {{ $json.some.path }} or {{ $json["key"] }}
const EXPR_RE = /\{\{\s*\$json((?:\.[a-zA-Z_$][\w$]*|\["[^"]*"\])*)\s*\}\}/g;
// Regex matching {{ $env.VAR_NAME }}
const ENV_EXPR_RE = /\{\{\s*\$env\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;

function getPath(obj: unknown, path: string): unknown {
  if (path === "") return obj;
  const parts = path
    .split(/\.(?![^[]*])/)
    .filter(Boolean)
    .map((p) => p.replace(/^\["(.*)"\]$/, "$1"));
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function resolveExpr(expr: string, data: JsonValue): unknown {
  const path = expr.trim().replace(/^\$json/, "");
  return getPath(data, path);
}

/** Resolve `{{ $json.x }}` and `{{ $env.X }}` template expressions in a string or object. */
function resolveTemplates(
  value: unknown,
  upstreamOutput: JsonValue,
  env: Readonly<Record<string, string>>,
): unknown {
  if (typeof value === "string") {
    // If the whole string is a single $json expression, return native type.
    const singleMatch = value.match(
      /^\{\{\s*\$json((?:\.[a-zA-Z_$][\w$]*|\["[^"]*"\])*)\s*\}\}$/,
    );
    if (singleMatch) {
      return resolveExpr(value, upstreamOutput);
    }
    // Otherwise replace all $json and $env expressions inline (string output).
    return value
      .replace(EXPR_RE, (_full, path) => {
        const resolved = getPath(upstreamOutput, path);
        return resolved == null ? "" : String(resolved);
      })
      .replace(ENV_EXPR_RE, (_full, name: string) => env[name] ?? "");
  }
  if (Array.isArray(value)) {
    return value.map((item) => resolveTemplates(item, upstreamOutput, env));
  }
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveTemplates(v, upstreamOutput, env);
    }
    return out;
  }
  return value;
}

/**
 * Accumulates per-node outputs for a single run.
 * Provides template-expression resolution (`{{ $json.x }}`, `{{ $env.X }}`) against upstream output.
 */
export class RunState {
  private readonly outputs = new Map<string, JsonValue>();
  private readonly env: Readonly<Record<string, string>>;

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
    return resolveTemplates(params, upstreamOutput, this.env) as Record<
      string,
      unknown
    >;
  }
}
