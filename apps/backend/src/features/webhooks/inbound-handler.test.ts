import { createHmac } from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@mirrorverse/db", () => ({
  getDb: vi.fn(() => ({})),
}));

vi.mock("./webhook-endpoints-repo", () => ({
  getEndpointBySlug: vi.fn(),
  logInbound: vi.fn(),
  incrementCallCount: vi.fn(),
}));

vi.mock("./dispatch", () => ({
  dispatchWebhookRun: vi.fn(),
}));

import { inboundWebhookHandler } from "./inbound-handler";
import {
  getEndpointBySlug,
  logInbound,
  incrementCallCount,
} from "./webhook-endpoints-repo";
import { dispatchWebhookRun } from "./dispatch";

const mockGetEndpoint = vi.mocked(getEndpointBySlug);
const mockLog = vi.mocked(logInbound);
const mockDispatch = vi.mocked(dispatchWebhookRun);
const mockIncrement = vi.mocked(incrementCallCount);

const baseEndpoint = {
  id: "ep1",
  workspaceId: "ws1",
  workflowId: "wf1",
  triggerNodeId: "node1",
  slug: "my-hook",
  secret: "test-secret",
  verifySignature: false,
  enabled: true,
  lastCalledAt: null,
  callsLast24h: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeRequest(body: unknown, headers: Record<string, string> = {}) {
  const bodyStr = JSON.stringify(body);
  return new Request("http://localhost/api/webhooks/my-hook", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: bodyStr,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLog.mockResolvedValue(true);
  mockDispatch.mockResolvedValue(undefined);
  mockIncrement.mockResolvedValue(undefined);
});

describe("inboundWebhookHandler", () => {
  it("returns 404 when endpoint not found", async () => {
    mockGetEndpoint.mockResolvedValue(null as unknown as typeof baseEndpoint);
    const res = await inboundWebhookHandler(
      makeRequest({ test: true }),
      "missing",
    );
    expect(res.status).toBe(404);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("returns 404 when endpoint is disabled", async () => {
    mockGetEndpoint.mockResolvedValue({ ...baseEndpoint, enabled: false });
    const res = await inboundWebhookHandler(
      makeRequest({ test: true }),
      "my-hook",
    );
    expect(res.status).toBe(404);
  });

  it("dispatches and returns 200 for a valid request", async () => {
    mockGetEndpoint.mockResolvedValue(baseEndpoint);
    const res = await inboundWebhookHandler(
      makeRequest({ event: "order.created" }),
      "my-hook",
    );
    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalledOnce();
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("returns 200 without dispatching on duplicate request-id", async () => {
    mockGetEndpoint.mockResolvedValue(baseEndpoint);
    mockLog.mockResolvedValue(false);
    const res = await inboundWebhookHandler(
      makeRequest({ test: true }, { "x-request-id": "req-123" }),
      "my-hook",
    );
    expect(res.status).toBe(200);
    expect(mockDispatch).not.toHaveBeenCalled();
    const body = (await res.json()) as { duplicate: boolean };
    expect(body.duplicate).toBe(true);
  });

  it("returns 401 and logs rejected when HMAC signature is invalid", async () => {
    mockGetEndpoint.mockResolvedValue({
      ...baseEndpoint,
      verifySignature: true,
    });
    const res = await inboundWebhookHandler(
      makeRequest({ test: true }, { "x-mirrorverse-signature": "badsig" }),
      "my-hook",
    );
    expect(res.status).toBe(401);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith(
      expect.anything(),
      "ep1",
      "my-hook",
      null,
      "POST",
      expect.any(Object),
      // body column is NOT NULL — a null here made the insert throw (500).
      { rejected: "invalid_signature" },
      "rejected",
    );
  });

  it("logs an empty object for an empty body", async () => {
    mockGetEndpoint.mockResolvedValue(baseEndpoint);
    const res = await inboundWebhookHandler(
      new Request("http://localhost/api/webhooks/my-hook", { method: "POST" }),
      "my-hook",
    );
    expect(res.status).toBe(200);
    expect(mockLog.mock.calls[0]?.[6]).toEqual({});
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.anything(),
      baseEndpoint,
      null,
    );
  });

  it("returns 200 when HMAC signature is valid", async () => {
    const body = JSON.stringify({ test: true });
    const sig = createHmac("sha256", baseEndpoint.secret)
      .update(body)
      .digest("hex");
    mockGetEndpoint.mockResolvedValue({
      ...baseEndpoint,
      verifySignature: true,
    });
    const req = new Request("http://localhost/api/webhooks/my-hook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mirrorverse-signature": sig,
      },
      body,
    });
    const res = await inboundWebhookHandler(req, "my-hook");
    expect(res.status).toBe(200);
    expect(mockDispatch).toHaveBeenCalledOnce();
  });
});
