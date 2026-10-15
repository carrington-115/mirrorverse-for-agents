import { Cron } from "croner";
import type { WorkflowDocument, WorkflowKind } from "@mirrorverse/types";

export type DeployIssueCode =
  | "no_trigger"
  | "multiple_triggers"
  | "unsupported_trigger"
  | "unsupported_node"
  | "invalid_cron"
  | "invalid_timezone"
  | "missing_webhook_slug"
  | "invalid_webhook_slug"
  | "duplicate_webhook_slug"
  | "webhook_slug_taken"
  | "missing_connection"
  | "missing_env_var";

export interface DeployIssue {
  readonly nodeId: string | null;
  readonly code: DeployIssueCode;
  readonly message: string;
}

// Workspace state the validator checks references against. Gathered by the
// service so this module stays pure and unit-testable.
export interface DeployLookups {
  /** Webhook slugs already claimed by endpoints of *other* workflows. */
  readonly takenWebhookSlugs: ReadonlySet<string>;
  /** Lower-cased app slugs with an active connection in the workspace. */
  readonly connectedAppSlugs: ReadonlySet<string>;
  /** Names of workspace env vars. */
  readonly envVarNames: ReadonlySet<string>;
}

// Mirrors the node types `graph-walker.ts` can execute. Keep in sync.
const RUNNABLE_NODE_TYPES: ReadonlySet<string> = new Set([
  "trigger.manual",
  "trigger.cron",
  "trigger.webhook",
  "trigger.inbound_call",
  "core.http_request",
  "core.tool_call",
  "core.code",
  "core.respond_to_webhook",
  "ai.voice_agent",
  "flow.if",
  "flow.switch",
  "flow.loop",
  "flow.filter",
  "flow.merge",
  "flow.wait",
  "flow.noop",
  "flow.stop",
  "transform",
  "ai.agent",
  "ai.language_model",
  "ai.memory",
  "ai.retriever",
  "ai.output_parser",
  "human.review",
  "editor.sticky_note",
]);

const AUTOMATION_TRIGGERS: ReadonlySet<string> = new Set([
  "trigger.manual",
  "trigger.cron",
  "trigger.webhook",
]);

const WEBHOOK_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/;
const ENV_REF_RE = /\{\{\s*\$env\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
const TEMPLATE_RE = /\{\{/;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function isValidCronExpression(
  expression: string,
  timezone: string,
): boolean {
  try {
    new Cron(expression, { timezone, paused: true }).stop();
    return true;
  } catch {
    return false;
  }
}

// Same heuristic the Composio dispatcher uses to map a tool slug
// (e.g. `GMAIL_SEND_EMAIL`) back to its toolkit (`gmail`).
export function appSlugForComposioTool(toolName: string): string {
  return toolName.split("_")[0]?.toLowerCase() ?? toolName.toLowerCase();
}

function collectEnvRefs(value: unknown, out: Set<string>): void {
  if (typeof value === "string") {
    for (const match of value.matchAll(ENV_REF_RE)) {
      if (match[1]) out.add(match[1]);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectEnvRefs(item, out);
  } else if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectEnvRefs(item, out);
  }
}

/**
 * Checks that a workflow version can actually run once deployed. Returns an
 * empty array when the document is deployable.
 */
export function validateDeployDocument(
  doc: WorkflowDocument,
  kind: WorkflowKind,
  lookups: DeployLookups,
): DeployIssue[] {
  const issues: DeployIssue[] = [];
  const triggers = doc.nodes.filter((n) => n.type.startsWith("trigger."));

  if (kind === "automation" && triggers.length === 0) {
    issues.push({
      nodeId: null,
      code: "no_trigger",
      message: "Add a trigger (manual, schedule, or webhook) before deploying.",
    });
  }
  if (triggers.length > 1) {
    for (const t of triggers.slice(1)) {
      issues.push({
        nodeId: t.id,
        code: "multiple_triggers",
        message:
          "Only one trigger per workflow is supported. Remove the extra trigger.",
      });
    }
  }

  const seenSlugs = new Set<string>();
  const envRefs = new Set<string>();

  for (const node of doc.nodes) {
    if (node.type.startsWith("trigger.")) {
      const supported =
        kind === "automation"
          ? AUTOMATION_TRIGGERS.has(node.type)
          : RUNNABLE_NODE_TYPES.has(node.type);
      if (!supported) {
        issues.push({
          nodeId: node.id,
          code: "unsupported_trigger",
          message: `The "${node.type}" trigger can't be deployed yet.`,
        });
        continue;
      }
    } else if (!RUNNABLE_NODE_TYPES.has(node.type)) {
      issues.push({
        nodeId: node.id,
        code: "unsupported_node",
        message: `The "${node.type}" step isn't supported by the runtime yet.`,
      });
      continue;
    }

    collectEnvRefs(node.params, envRefs);

    if (node.type === "trigger.cron") {
      const expression = str(node.params.expression);
      const timezone = str(node.params.timezone) || "UTC";
      if (!isValidTimezone(timezone)) {
        issues.push({
          nodeId: node.id,
          code: "invalid_timezone",
          message: `"${timezone}" is not a valid timezone.`,
        });
      } else if (!expression || !isValidCronExpression(expression, timezone)) {
        issues.push({
          nodeId: node.id,
          code: "invalid_cron",
          message: expression
            ? `"${expression}" is not a valid cron schedule.`
            : "Set a cron schedule for this trigger.",
        });
      }
    }

    if (node.type === "trigger.webhook") {
      const slug = str(node.params.endpointSlug);
      if (!slug) {
        issues.push({
          nodeId: node.id,
          code: "missing_webhook_slug",
          message: "Set an endpoint slug for this webhook.",
        });
      } else if (!WEBHOOK_SLUG_RE.test(slug)) {
        issues.push({
          nodeId: node.id,
          code: "invalid_webhook_slug",
          message:
            "Webhook slugs may only contain letters, numbers, dashes, and underscores.",
        });
      } else if (seenSlugs.has(slug)) {
        issues.push({
          nodeId: node.id,
          code: "duplicate_webhook_slug",
          message: `The slug "${slug}" is used by more than one webhook in this workflow.`,
        });
      } else if (lookups.takenWebhookSlugs.has(slug)) {
        issues.push({
          nodeId: node.id,
          code: "webhook_slug_taken",
          message: `The webhook URL "/${slug}" is already used by another workflow. Choose a different slug.`,
        });
      }
      seenSlugs.add(slug);
    }

    if (node.type === "core.tool_call") {
      const server = str(node.params.mcpServerId);
      const toolName = str(node.params.toolName);
      if (
        server !== "" &&
        server !== "composio" &&
        !server.startsWith("first_party.")
      ) {
        issues.push({
          nodeId: node.id,
          code: "unsupported_node",
          message:
            "Custom MCP servers can't be used in deployed workflows yet.",
        });
      } else if (
        (server === "" || server === "composio") &&
        toolName &&
        !TEMPLATE_RE.test(toolName)
      ) {
        const appSlug = appSlugForComposioTool(toolName);
        if (!lookups.connectedAppSlugs.has(appSlug)) {
          issues.push({
            nodeId: node.id,
            code: "missing_connection",
            message: `Connect ${appSlug} before deploying — "${toolName}" needs it.`,
          });
        }
      }
    }
  }

  for (const name of envRefs) {
    if (!lookups.envVarNames.has(name)) {
      issues.push({
        nodeId: null,
        code: "missing_env_var",
        message: `Environment variable "${name}" is referenced but not defined.`,
      });
    }
  }

  return issues;
}
