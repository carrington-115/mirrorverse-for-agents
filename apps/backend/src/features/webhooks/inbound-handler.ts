import { getDb } from "@mirrorverse/db";
import type { JsonValue } from "@mirrorverse/types";

import { dispatchWebhookRun } from "./dispatch";
import {
  getEndpointBySlug,
  incrementCallCount,
  logInbound,
} from "./webhook-endpoints-repo";
import { verifyHmacSignature } from "./verify";

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function inboundWebhookHandler(
  request: Request,
  slug: string,
): Promise<Response> {
  const db = getDb();
  const endpoint = await getEndpointBySlug(db, slug);

  if (!endpoint || !endpoint.enabled) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const rawBody = await request.text();
  const requestId = request.headers.get("x-request-id") ?? null;
  const headersRecord = headersToRecord(request.headers);

  if (endpoint.verifySignature) {
    const sig = request.headers.get("x-mirrorverse-signature");
    if (!verifyHmacSignature(rawBody, endpoint.secret, sig)) {
      await logInbound(
        db,
        endpoint.id,
        slug,
        requestId,
        request.method,
        headersRecord,
        // body is NOT NULL; never store an unverified payload.
        { rejected: "invalid_signature" },
        "rejected",
      );
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let body: JsonValue;
  try {
    body = rawBody.length > 0 ? (JSON.parse(rawBody) as JsonValue) : null;
  } catch {
    body = rawBody.length > 0 ? { raw: rawBody } : null;
  }

  const dispatched = await logInbound(
    db,
    endpoint.id,
    slug,
    requestId,
    request.method,
    headersRecord,
    body ?? {},
    "dispatched",
  );

  if (!dispatched) {
    return Response.json({ ok: true, duplicate: true }, { status: 200 });
  }

  const dispatch = await dispatchWebhookRun(db, endpoint, body);

  void incrementCallCount(db, endpoint.id);

  if (!dispatch.dispatched && dispatch.reason === "run_limit") {
    return Response.json({ error: dispatch.message }, { status: 429 });
  }

  return Response.json({ ok: true }, { status: 200 });
}
