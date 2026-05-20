import type { WorkflowNodeInput } from "./workflow";

export interface PaletteEntry {
  readonly kind: string;
  readonly label: string;
  readonly category: PaletteCategory;
  readonly description: string;
}

export type PaletteCategory = "Triggers" | "Core" | "AI" | "Flow" | "Transform" | "Skill";

// Curated catalog. Phase B exposes these in the palette; remaining kinds
// (human.review, editor.sticky_note, sub_workflow flavours, etc.) will land
// when their property panels do.
export const PALETTE_ENTRIES: readonly PaletteEntry[] = [
  {
    kind: "trigger.manual",
    label: "Manual trigger",
    category: "Triggers",
    description: "Run on demand from the editor or a button.",
  },
  {
    kind: "trigger.cron",
    label: "Schedule",
    category: "Triggers",
    description: "Run on a recurring cron schedule.",
  },
  {
    kind: "trigger.webhook",
    label: "Webhook",
    category: "Triggers",
    description: "Run when an HTTP request hits a tenant URL.",
  },
  {
    kind: "trigger.chat_message",
    label: "Chat message",
    category: "Triggers",
    description: "Run when a message arrives on a connected channel.",
  },
  {
    kind: "core.http_request",
    label: "HTTP request",
    category: "Core",
    description: "Call an external HTTP endpoint.",
  },
  {
    kind: "core.code",
    label: "Code",
    category: "Core",
    description: "Run a TypeScript snippet in a sandbox.",
  },
  {
    kind: "core.tool_call",
    label: "Tool call",
    category: "Core",
    description: "Invoke a tool exposed by an MCP server.",
  },
  {
    kind: "ai.agent",
    label: "AI agent",
    category: "AI",
    description: "Run an LLM agent with prompts, memory, and tools.",
  },
  {
    kind: "ai.language_model",
    label: "Language model",
    category: "AI",
    description: "Configure a model for an agent slot.",
  },
  {
    kind: "ai.memory",
    label: "Memory",
    category: "AI",
    description: "Give an agent conversational memory.",
  },
  {
    kind: "flow.if",
    label: "If",
    category: "Flow",
    description: "Branch on a condition.",
  },
  {
    kind: "flow.switch",
    label: "Switch",
    category: "Flow",
    description: "Route to one of several outputs.",
  },
  {
    kind: "flow.loop",
    label: "Loop",
    category: "Flow",
    description: "Iterate over a list.",
  },
  {
    kind: "flow.merge",
    label: "Merge",
    category: "Flow",
    description: "Combine branches back together.",
  },
  {
    kind: "flow.wait",
    label: "Wait",
    category: "Flow",
    description: "Pause for a duration or until a signal.",
  },
  {
    kind: "flow.noop",
    label: "No-op",
    category: "Flow",
    description: "Pass-through placeholder.",
  },
  {
    kind: "transform",
    label: "Transform",
    category: "Transform",
    description: "Reshape data between steps.",
  },
];

const TYPE_PREFIX = "mirrorverse.";

interface DefaultNodeArgs {
  readonly kind: string;
  readonly id: string;
  readonly name: string;
  readonly position: { readonly x: number; readonly y: number };
}

function baseNode({ kind, id, name, position }: DefaultNodeArgs) {
  return {
    id,
    name,
    position,
    type: `${TYPE_PREFIX}${kind}`,
    typeVersion: 1,
    notes: null,
    disabled: false,
    continueOnFail: false,
    kind,
  };
}

// Returns a minimum-valid node for the given kind. Returns null for kinds
// the catalog doesn't cover yet; callers should treat that as "not in the
// palette."
export function defaultNodeForKind(args: DefaultNodeArgs): WorkflowNodeInput | null {
  const base = baseNode(args);
  switch (args.kind) {
    case "trigger.manual":
      return { ...base, kind: "trigger.manual" } as WorkflowNodeInput;
    case "trigger.cron":
      return {
        ...base,
        kind: "trigger.cron",
        expression: "0 9 * * *",
        timezone: "UTC",
      } as WorkflowNodeInput;
    case "trigger.webhook":
      return {
        ...base,
        kind: "trigger.webhook",
        endpointSlug: `webhook-${args.id.slice(0, 6)}`,
        method: "POST",
        verifySignature: false,
        responseMode: "on_received",
        webhookId: `wh-${args.id.slice(0, 6)}`,
      } as WorkflowNodeInput;
    case "trigger.chat_message":
      return {
        ...base,
        kind: "trigger.chat_message",
        channels: [{ kind: "web" }],
      } as WorkflowNodeInput;
    case "core.http_request":
      return {
        ...base,
        kind: "core.http_request",
        method: "GET",
        url: { mode: "static", value: "https://example.com" },
        headers: {},
        query: {},
        body: null,
        authentication: { kind: "none" },
        retry: { maxAttempts: 1, backoff: "none", initialDelayMs: 0 },
      } as WorkflowNodeInput;
    case "core.code":
      return {
        ...base,
        kind: "core.code",
        language: "typescript",
        source: "return { message: 'hello' };",
        timeoutSec: 10,
        memoryMb: 128,
        networkAllowlist: [],
      } as WorkflowNodeInput;
    case "core.tool_call":
      return {
        ...base,
        kind: "core.tool_call",
        mcpServerId: "mcp_placeholder",
        toolName: "tool",
        parameters: {},
        toolMode: false,
        retry: { maxAttempts: 1, backoff: "none", initialDelayMs: 0 },
      } as WorkflowNodeInput;
    case "ai.agent":
      return {
        ...base,
        kind: "ai.agent",
        systemPrompt: "You are a helpful assistant.",
        userPromptTemplate: { mode: "expression", expr: "{{ $json.text }}" },
        maxIterations: 5,
        outputMode: "text",
        outputSchema: null,
      } as WorkflowNodeInput;
    case "ai.language_model":
      return {
        ...base,
        kind: "ai.language_model",
        provider: "anthropic",
        model: "claude-haiku-4-5",
        options: {
          temperature: 0.7,
          maxTokens: 1024,
          topP: null,
          stopSequences: [],
        },
      } as WorkflowNodeInput;
    case "ai.memory":
      return {
        ...base,
        kind: "ai.memory",
        strategy: "buffer_window",
        contextWindowLength: 5,
        sessionKeyExpression: null,
      } as WorkflowNodeInput;
    case "flow.if":
      return {
        ...base,
        kind: "flow.if",
        conditions: [
          {
            id: `cond_${args.id.slice(0, 6)}`,
            leftValue: { mode: "expression", expr: "{{ $json.x }}" },
            operator: "equals",
            rightValue: { mode: "static", value: true },
          },
        ],
        combinator: "and",
      } as WorkflowNodeInput;
    case "flow.switch":
      return {
        ...base,
        kind: "flow.switch",
        mode: "expression",
        cases: [{ when: "{{ $json.x === 'a' }}", outputIndex: 0 }],
        defaultOutputIndex: 1,
      } as WorkflowNodeInput;
    case "flow.loop":
      return {
        ...base,
        kind: "flow.loop",
        mode: "for_each",
        iterableExpression: "{{ $json.items }}",
        batchSize: 1,
      } as WorkflowNodeInput;
    case "flow.merge":
      return {
        ...base,
        kind: "flow.merge",
        strategy: "append",
        keyExpression: null,
      } as WorkflowNodeInput;
    case "flow.wait":
      return {
        ...base,
        kind: "flow.wait",
        until: { mode: "duration", ms: 5000 },
      } as WorkflowNodeInput;
    case "flow.noop":
      return { ...base, kind: "flow.noop" } as WorkflowNodeInput;
    case "transform":
      return {
        ...base,
        kind: "transform",
        op: "edit_fields",
        config: {},
      } as WorkflowNodeInput;
    default:
      return null;
  }
}
