export interface SandboxPolicy {
  readonly timeoutMs: number;
  readonly memoryMb: number;
  readonly egressAllowlist: readonly string[];
}

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_MEMORY_MB = 512;
// Note: full network-level egress blocking requires E2B enterprise.
// At the standard tier we enforce the allowlist via a language-level prelude
// injected before the user's source runs (see runner.ts). This catches the most
// common HTTP libraries but cannot block native OS-level syscalls.
const DEFAULT_EGRESS_ALLOWLIST: string[] = ["api.github.com"];

export function resolvePolicy(params: Record<string, unknown>): SandboxPolicy {
  const raw = params as Record<string, unknown>;

  const timeoutMs = Math.min(
    typeof raw.timeoutMs === "number" && raw.timeoutMs > 0
      ? raw.timeoutMs
      : DEFAULT_TIMEOUT_MS,
    MAX_TIMEOUT_MS,
  );

  const memoryMb =
    typeof raw.memoryMb === "number" && raw.memoryMb > 0
      ? raw.memoryMb
      : DEFAULT_MEMORY_MB;

  const egressAllowlist =
    Array.isArray(raw.egressAllowlist) &&
    raw.egressAllowlist.every((h) => typeof h === "string")
      ? (raw.egressAllowlist as string[])
      : DEFAULT_EGRESS_ALLOWLIST;

  return { timeoutMs, memoryMb, egressAllowlist };
}

export function buildEgressPrelude(
  language: "python" | "typescript",
  allowlist: readonly string[],
): string {
  const allowedSet = JSON.stringify(allowlist);

  if (language === "python") {
    return `
import urllib.request as _urllib_request
import urllib.parse as _urllib_parse
_EGRESS_ALLOWED = set(${allowedSet})
_orig_urlopen = _urllib_request.urlopen
def _guarded_urlopen(url, *a, **kw):
    host = _urllib_parse.urlparse(url if isinstance(url, str) else url.full_url).hostname or ""
    if _EGRESS_ALLOWED and host not in _EGRESS_ALLOWED:
        raise PermissionError(f"Egress blocked: '{host}' is not in the allowlist")
    return _orig_urlopen(url, *a, **kw)
_urllib_request.urlopen = _guarded_urlopen
del _orig_urlopen, _guarded_urlopen
`;
  }

  // TypeScript / JavaScript
  return `
const _EGRESS_ALLOWED = new Set(${allowedSet});
const _origFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const host = new URL(url).hostname;
  if (_EGRESS_ALLOWED.size > 0 && !_EGRESS_ALLOWED.has(host)) {
    throw new Error(\`Egress blocked: '\${host}' is not in the allowlist\`);
  }
  return _origFetch(input, init);
};
`;
}
