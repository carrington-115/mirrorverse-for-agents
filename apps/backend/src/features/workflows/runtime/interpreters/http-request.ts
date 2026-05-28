import type { JsonValue } from "@mirrorverse/types";
import type { WorkflowNode } from "@mirrorverse/types";
import type { RunState } from "../run-state";
import type { InterpretResult } from "./types";

interface HttpRequestParams {
  readonly method?: string;
  readonly url?: string;
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, string>;
  readonly body?: unknown;
}

export async function interpretHttpRequest(
  node: WorkflowNode,
  input: JsonValue,
  state: RunState,
): Promise<InterpretResult> {
  const raw = state.resolveParams(node.params, input) as HttpRequestParams;

  const method = (raw.method ?? "GET").toUpperCase();
  const rawUrl = raw.url ?? "";
  if (!rawUrl) throw new Error("core.http_request: url is required");

  // Append query params
  const url = new URL(rawUrl);
  if (raw.query) {
    for (const [k, v] of Object.entries(raw.query)) {
      url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (raw.headers) {
    for (const [k, v] of Object.entries(raw.headers)) {
      headers[k] = String(v);
    }
  }

  let bodyPayload: BodyInit | undefined;
  if (raw.body != null && method !== "GET" && method !== "HEAD") {
    if (typeof raw.body === "string") {
      bodyPayload = raw.body;
    } else {
      bodyPayload = JSON.stringify(raw.body);
      headers["content-type"] ??= "application/json";
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: bodyPayload,
    signal: AbortSignal.timeout(30_000),
  });

  let responseBody: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    responseBody = await res.json().catch(() => null);
  } else {
    responseBody = await res.text();
  }

  if (!res.ok) {
    throw new Error(
      `core.http_request: HTTP ${res.status} ${res.statusText} from ${url.toString()}`,
    );
  }

  const headersObj: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headersObj[key] = value;
  });

  const output: JsonValue = {
    status: res.status,
    headers: headersObj,
    body: responseBody as JsonValue,
  };

  return { output, nextPorts: ["main"] };
}
