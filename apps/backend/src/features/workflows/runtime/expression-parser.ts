// A single property-access token: `.foo`, `["some key"]`, `['some key']`, or `[0]`.
const PATH_TOKEN = `(?:\\.[a-zA-Z_$][\\w$]*|\\["[^"]*"\\]|\\['[^']*'\\]|\\[\\d+\\])`;
const PATH_TOKEN_RE = new RegExp(PATH_TOKEN, "g");
const PATH_TOKEN_HEAD_RE = new RegExp(`^${PATH_TOKEN}`);

const IDENT_RE = /^[a-zA-Z_$][\w$]*/;
// Slice/at args allow a leading `-` (e.g. `.slice(-1)`); bracket indices (`[0]`) never do,
// since they're produced by PATH_TOKEN/the `[\d+]` index-suffix grammar, which is non-negative.
const INTEGER_RE = /^-?\d+/;

const NODE_REF_ROOT_RE = /^\$\(\s*(['"])([^'"]+)\1\s*\)\.item\.json/;
const ENV_ROOT_RE = /^\$env\.([A-Za-z_][A-Za-z0-9_]*)$/;
const INDEX_SUFFIX_RE = /^\[(\d+)\]/;

export type SupportedOperation =
  | "split"
  | "trim"
  | "toUpperCase"
  | "toLowerCase"
  | "slice"
  | "join"
  | "replace"
  | "at";

const SUPPORTED_OPERATIONS: ReadonlySet<string> = new Set([
  "split",
  "trim",
  "toUpperCase",
  "toLowerCase",
  "slice",
  "join",
  "replace",
]);

export type OperationArg = string | number;

export interface OperationCall {
  readonly name: SupportedOperation;
  readonly args: readonly OperationArg[];
}

export type ExpressionRoot =
  | { readonly kind: "json" }
  | { readonly kind: "nodeRef"; readonly nodeId: string }
  | { readonly kind: "env"; readonly name: string };

export interface ParsedExpression {
  readonly root: ExpressionRoot;
  readonly path: string;
  readonly ops: readonly OperationCall[];
}

// Extracts the key from a single path token: `.foo` -> "foo", `["foo"]` / `['foo']` -> "foo",
// `[0]` -> "0" (numeric string keys index arrays the same as numbers in JS).
function tokenKey(token: string): string {
  if (token.startsWith(".")) return token.slice(1);
  const inner = token.slice(1, -1);
  return /^\d+$/.test(inner) ? inner : inner.slice(1, -1);
}

export function getPath(obj: unknown, path: string): unknown {
  if (path === "") return obj;
  let cur: unknown = obj;
  for (const token of path.match(PATH_TOKEN_RE) ?? []) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[tokenKey(token)];
  }
  return cur;
}

function parseRoot(src: string): { root: ExpressionRoot; rest: string } | null {
  if (src.startsWith("$json")) {
    return { root: { kind: "json" }, rest: src.slice("$json".length) };
  }

  const nodeRefMatch = src.match(NODE_REF_ROOT_RE);
  if (nodeRefMatch) {
    return {
      root: { kind: "nodeRef", nodeId: nodeRefMatch[2]! },
      rest: src.slice(nodeRefMatch[0].length),
    };
  }

  // Env vars have no path/op-chain, so the whole expression must be `$env.NAME`.
  const envMatch = src.match(ENV_ROOT_RE);
  if (envMatch) return { root: { kind: "env", name: envMatch[1]! }, rest: "" };

  return null;
}

function parsePath(src: string): { path: string; rest: string } {
  let path = "";
  let rest = src;
  for (;;) {
    const match = rest.match(PATH_TOKEN_HEAD_RE);
    if (!match) break;
    const token = match[0];
    // `.identifier(` starts an operation call, not a path access.
    if (token.startsWith(".") && rest.slice(token.length).startsWith("("))
      break;
    path += token;
    rest = rest.slice(token.length);
  }
  return { path, rest };
}

function skipWhitespace(src: string): string {
  return src.replace(/^\s+/, "");
}

function parseStringLiteral(
  src: string,
): { value: string; rest: string } | null {
  const quote = src[0];
  if (quote !== "'" && quote !== '"') return null;

  let value = "";
  let i = 1;
  while (i < src.length) {
    const ch = src[i];
    if (ch === quote) return { value, rest: src.slice(i + 1) };
    if (ch === "\\") {
      const next = src[i + 1];
      if (next === undefined) return null;
      switch (next) {
        case "n":
          value += "\n";
          break;
        case "t":
          value += "\t";
          break;
        default:
          value += next;
      }
      i += 2;
      continue;
    }
    value += ch;
    i += 1;
  }
  return null; // unterminated string
}

function parseArg(src: string): { value: OperationArg; rest: string } | null {
  const str = parseStringLiteral(src);
  if (str) return str;
  const num = src.match(INTEGER_RE);
  if (num) return { value: Number(num[0]), rest: src.slice(num[0].length) };
  return null;
}

function parseArgList(
  src: string,
): { args: OperationArg[]; rest: string } | null {
  let rest = skipWhitespace(src);
  const args: OperationArg[] = [];
  if (rest.startsWith(")")) return { args, rest };

  for (;;) {
    const arg = parseArg(rest);
    if (!arg) return null;
    args.push(arg.value);
    rest = skipWhitespace(arg.rest);
    if (rest.startsWith(",")) {
      rest = skipWhitespace(rest.slice(1));
      continue;
    }
    if (rest.startsWith(")")) return { args, rest };
    return null;
  }
}

function parseOpChain(src: string): readonly OperationCall[] | null {
  const ops: OperationCall[] = [];
  let rest = src;
  while (rest.length > 0) {
    if (!rest.startsWith(".")) return null;
    rest = rest.slice(1);

    const nameMatch = rest.match(IDENT_RE);
    if (!nameMatch) return null;
    const name = nameMatch[0];
    if (!SUPPORTED_OPERATIONS.has(name)) return null;
    rest = rest.slice(name.length);

    if (!rest.startsWith("(")) return null;
    const argsResult = parseArgList(rest.slice(1));
    if (!argsResult || !argsResult.rest.startsWith(")")) return null;
    rest = argsResult.rest.slice(1);
    ops.push({ name: name as SupportedOperation, args: argsResult.args });

    const indexMatch = rest.match(INDEX_SUFFIX_RE);
    if (indexMatch) {
      ops.push({ name: "at", args: [Number(indexMatch[1])] });
      rest = rest.slice(indexMatch[0].length);
    }
  }
  return ops;
}

/**
 * Parses a `{{ ... }}` expression's inner content (already trimmed of outer
 * `{{`/`}}` and whitespace). Returns `null` if the expression doesn't match
 * the supported grammar — callers treat that as "unresolved".
 */
export function parseTemplateExpression(src: string): ParsedExpression | null {
  const rootResult = parseRoot(src);
  if (!rootResult) return null;
  const { root, rest } = rootResult;

  if (root.kind === "env") return { root, path: "", ops: [] };

  const { path, rest: afterPath } = parsePath(rest);
  if (afterPath.length === 0) return { root, path, ops: [] };

  const ops = parseOpChain(afterPath);
  if (!ops) return null;
  return { root, path, ops };
}

function applyOperation(value: unknown, op: OperationCall): unknown {
  switch (op.name) {
    case "split": {
      const sep = op.args[0];
      if (typeof value !== "string" || typeof sep !== "string")
        return undefined;
      return value.split(sep);
    }
    case "trim":
      return typeof value === "string" ? value.trim() : undefined;
    case "toUpperCase":
      return typeof value === "string" ? value.toUpperCase() : undefined;
    case "toLowerCase":
      return typeof value === "string" ? value.toLowerCase() : undefined;
    case "slice": {
      const start = op.args[0];
      const end = op.args[1];
      if (typeof start !== "number") return undefined;
      if (end !== undefined && typeof end !== "number") return undefined;
      if (typeof value === "string") return value.slice(start, end);
      if (Array.isArray(value)) return value.slice(start, end);
      return undefined;
    }
    case "join": {
      const sep = op.args[0];
      if (!Array.isArray(value) || typeof sep !== "string") return undefined;
      return value.map((item) => String(item)).join(sep);
    }
    case "replace": {
      const search = op.args[0];
      const replacement = op.args[1];
      if (
        typeof value !== "string" ||
        typeof search !== "string" ||
        typeof replacement !== "string"
      ) {
        return undefined;
      }
      return value.replaceAll(search, replacement);
    }
    case "at": {
      const index = op.args[0];
      if (typeof index !== "number" || index < 0) return undefined;
      if (typeof value === "string" || Array.isArray(value)) {
        return index < value.length ? value[index] : undefined;
      }
      return undefined;
    }
  }
}

/** Applies a chain of whitelisted operations left-to-right, short-circuiting on `undefined`. */
export function evaluateOperations(
  value: unknown,
  ops: readonly OperationCall[],
): unknown {
  let current = value;
  for (const op of ops) {
    if (current === undefined) return undefined;
    current = applyOperation(current, op);
  }
  return current;
}
