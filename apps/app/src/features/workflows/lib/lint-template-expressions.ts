// Heuristic, regex-based mirror of the backend's `{{ }}` expression grammar
// (apps/backend/src/features/workflows/runtime/expression-parser.ts), for
// editor-time hints. The backend parser remains the source of truth/enforcement;
// this is best-effort UX feedback in the node inspector.

const PATH_TOKEN = `(?:\\.[a-zA-Z_$][\\w$]*|\\["[^"]*"\\]|\\['[^']*'\\]|\\[\\d+\\])`;
const SUPPORTED_OPS = "split|trim|toUpperCase|toLowerCase|slice|join|replace";
const OP_TOKEN = `(?:\\.(?:${SUPPORTED_OPS})\\([^()]*\\)(?:\\[\\d+\\])?)`;
const PATH_OR_OP = `(?:${PATH_TOKEN}|${OP_TOKEN})`;

const JSON_ROOT = `\\$json`;
const NODE_REF_ROOT = `\\$\\(\\s*(?:['"])[^'"]+(?:['"])\\s*\\)\\.item\\.json`;

const SUPPORTED_EXPR_RE = new RegExp(`^(?:${JSON_ROOT}|${NODE_REF_ROOT})${PATH_OR_OP}*$`);
const ENV_EXPR_RE = /^\$env\.[A-Za-z_][A-Za-z0-9_]*$/;

const INLINE_EXPR_RE = /\{\{([^{}]*)\}\}/g;

// Matches `$('nodeId').item.json.output` where `.output` is the *first* path
// segment (not e.g. `.outputs`) — the giveaway that a user copied the
// `.output` accessor onto a node whose output is already the raw value.
const NODE_REF_OUTPUT_RE = /^\$\(\s*(['"])([^'"]+)\1\s*\)\.item\.json\.output(?:[.[]|$)/;

const AGENT_NODE_TYPE = "ai.agent";

/**
 * Returns human-readable warnings for `{{ }}` expressions in `value` that
 * either don't match the supported grammar, or reference `.output` on an
 * `ai.agent` node (whose output is the raw text itself).
 */
export function lintTemplateExpressions(
  value: string,
  nodeTypesById: ReadonlyMap<string, string>,
): string[] {
  const warnings: string[] = [];

  for (const match of value.matchAll(INLINE_EXPR_RE)) {
    const inner = match[1]!.trim();

    const outputMatch = inner.match(NODE_REF_OUTPUT_RE);
    if (outputMatch && nodeTypesById.get(outputMatch[2]!) === AGENT_NODE_TYPE) {
      warnings.push(
        `"${outputMatch[2]}" is an agent node; its output is the text itself — drop ".output".`,
      );
      continue;
    }

    if (!SUPPORTED_EXPR_RE.test(inner) && !ENV_EXPR_RE.test(inner)) {
      warnings.push(`Unsupported expression: {{ ${inner} }}`);
    }
  }

  return warnings;
}

/**
 * Lints every string value of a flat-ish params object (e.g. core.tool_call's
 * `parameters`, transform's `config.fields`, core.http_request's `body`) and
 * returns a flat warnings list prefixed with the offending key, for display
 * under a single JSON-blob textarea.
 */
export function lintParamsObjectExpressions(
  obj: Record<string, unknown>,
  nodeTypesById: ReadonlyMap<string, string>,
): string[] {
  const warnings: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value !== "string") continue;
    for (const w of lintTemplateExpressions(value, nodeTypesById)) {
      warnings.push(`${key}: ${w}`);
    }
  }
  return warnings;
}
