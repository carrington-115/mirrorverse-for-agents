import { describe, expect, it } from "vitest";
import type { WorkflowDocument, WorkflowNode } from "@mirrorverse/types";

import {
  appSlugForComposioTool,
  isValidCronExpression,
  isValidTimezone,
  validateDeployDocument,
  type DeployLookups,
} from "./deploy-validation";

function node(
  id: string,
  type: string,
  params: Record<string, unknown> = {},
): WorkflowNode {
  return {
    id,
    type,
    params,
    position: { x: 0, y: 0 },
  } as unknown as WorkflowNode;
}

function doc(...nodes: WorkflowNode[]): WorkflowDocument {
  return {
    id: "wf1",
    name: "Test",
    version: 1,
    nodes,
    edges: [],
  } as unknown as WorkflowDocument;
}

const empty: DeployLookups = {
  takenWebhookSlugs: new Set(),
  connectedAppSlugs: new Set(),
  envVarNames: new Set(),
};

function codes(
  d: WorkflowDocument,
  lookups: DeployLookups = empty,
  kind = "automation" as const,
) {
  return validateDeployDocument(d, kind, lookups).map((i) => i.code);
}

describe("validateDeployDocument", () => {
  it("accepts a minimal manual workflow", () => {
    expect(
      codes(doc(node("t", "trigger.manual"), node("h", "core.http_request"))),
    ).toEqual([]);
  });

  it("requires a trigger for automations", () => {
    expect(codes(doc(node("h", "core.http_request")))).toEqual(["no_trigger"]);
  });

  it("does not require a trigger for agent kinds", () => {
    expect(
      validateDeployDocument(doc(node("a", "ai.agent")), "chat-agent", empty),
    ).toEqual([]);
  });

  it("flags extra triggers", () => {
    const issues = validateDeployDocument(
      doc(node("t1", "trigger.manual"), node("t2", "trigger.manual")),
      "automation",
      empty,
    );
    expect(issues).toEqual([
      expect.objectContaining({ nodeId: "t2", code: "multiple_triggers" }),
    ]);
  });

  it("rejects unsupported triggers and nodes", () => {
    expect(
      codes(doc(node("t", "trigger.app_event"), node("x", "core.mystery"))),
    ).toEqual(["unsupported_trigger", "unsupported_node"]);
  });

  it("validates cron expression and timezone", () => {
    expect(
      codes(
        doc(
          node("c", "trigger.cron", {
            expression: "0 9 * * *",
            timezone: "UTC",
          }),
        ),
      ),
    ).toEqual([]);
    expect(
      codes(doc(node("c", "trigger.cron", { expression: "not cron" }))),
    ).toEqual(["invalid_cron"]);
    expect(codes(doc(node("c", "trigger.cron", { expression: "" })))).toEqual([
      "invalid_cron",
    ]);
    expect(
      codes(
        doc(
          node("c", "trigger.cron", {
            expression: "0 9 * * *",
            timezone: "Mars/Base",
          }),
        ),
      ),
    ).toEqual(["invalid_timezone"]);
  });

  it("validates webhook slugs", () => {
    expect(
      codes(doc(node("w", "trigger.webhook", { endpointSlug: "" }))),
    ).toEqual(["missing_webhook_slug"]);
    expect(
      codes(doc(node("w", "trigger.webhook", { endpointSlug: "bad slug!" }))),
    ).toEqual(["invalid_webhook_slug"]);
    expect(
      codes(doc(node("w", "trigger.webhook", { endpointSlug: "taken" })), {
        ...empty,
        takenWebhookSlugs: new Set(["taken"]),
      }),
    ).toEqual(["webhook_slug_taken"]);
  });

  it("flags duplicate webhook slugs within a document", () => {
    const issues = validateDeployDocument(
      doc(
        node("w1", "trigger.webhook", { endpointSlug: "dup" }),
        node("w2", "trigger.webhook", { endpointSlug: "dup" }),
      ),
      "automation",
      empty,
    );
    expect(issues.map((i) => i.code)).toContain("duplicate_webhook_slug");
  });

  it("requires a connection for composio tool calls", () => {
    const d = doc(
      node("t", "trigger.manual"),
      node("g", "core.tool_call", {
        mcpServerId: "composio",
        toolName: "GMAIL_SEND_EMAIL",
      }),
    );
    expect(codes(d)).toEqual(["missing_connection"]);
    expect(
      codes(d, { ...empty, connectedAppSlugs: new Set(["gmail"]) }),
    ).toEqual([]);
  });

  it("skips connection checks for templated tool names and first-party servers", () => {
    expect(
      codes(
        doc(
          node("t", "trigger.manual"),
          node("a", "core.tool_call", { toolName: "{{ $json.tool }}" }),
          node("b", "core.tool_call", {
            mcpServerId: "first_party.vault",
            toolName: "get",
          }),
        ),
      ),
    ).toEqual([]);
  });

  it("rejects custom MCP servers", () => {
    expect(
      codes(
        doc(
          node("t", "trigger.manual"),
          node("a", "core.tool_call", {
            mcpServerId: "custom-123",
            toolName: "x",
          }),
        ),
      ),
    ).toEqual(["unsupported_node"]);
  });

  it("requires referenced env vars to exist", () => {
    const d = doc(
      node("t", "trigger.manual"),
      node("h", "core.http_request", {
        headers: { Authorization: "Bearer {{ $env.API_KEY }}" },
        url: "{{$env.BASE_URL}}/x",
      }),
    );
    expect(codes(d)).toEqual(["missing_env_var", "missing_env_var"]);
    expect(
      codes(d, { ...empty, envVarNames: new Set(["API_KEY", "BASE_URL"]) }),
    ).toEqual([]);
  });
});

describe("helpers", () => {
  it("isValidTimezone", () => {
    expect(isValidTimezone("America/New_York")).toBe(true);
    expect(isValidTimezone("Nope/Nope")).toBe(false);
  });

  it("isValidCronExpression", () => {
    expect(isValidCronExpression("*/5 * * * *", "UTC")).toBe(true);
    expect(isValidCronExpression("99 * * * *", "UTC")).toBe(false);
  });

  it("appSlugForComposioTool", () => {
    expect(appSlugForComposioTool("GOOGLECALENDAR_CREATE_EVENT")).toBe(
      "googlecalendar",
    );
  });
});
