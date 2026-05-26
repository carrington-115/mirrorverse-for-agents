import type { WorkflowNodeInput } from "./workflow";

export interface PaletteEntry {
  readonly kind: string;
  readonly label: string;
  readonly category: PaletteCategory;
  readonly description: string;
}

export type PaletteCategory =
  | "Triggers"
  | "Core"
  | "AI"
  | "AI:Agents"
  | "AI:Subcomponents"
  | "Flow"
  | "Transform"
  | "Skill"
  | "Editor";

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
    category: "AI:Agents",
    description: "LLM agent — connects to model, memory, tools, and retriever slots.",
  },
  {
    kind: "ai.voice_agent",
    label: "Voice agent",
    category: "AI:Agents",
    description: "Phone / voice agent — all agent slots plus a voice slot for VAPI telephony.",
  },
  {
    kind: "ai.language_model",
    label: "Language model",
    category: "AI:Subcomponents",
    description: "Configure a model for an agent slot.",
  },
  {
    kind: "ai.memory",
    label: "Memory",
    category: "AI:Subcomponents",
    description: "Give an agent conversational memory.",
  },
  {
    kind: "ai.retriever",
    label: "Knowledge base retriever",
    category: "AI:Subcomponents",
    description: "Wire a KB into an agent&apos;s retriever slot for RAG.",
  },
  {
    kind: "ai.output_parser",
    label: "Output parser",
    category: "AI:Subcomponents",
    description: "Parse and validate an agent&apos;s raw output.",
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
  {
    kind: "human.review",
    label: "Human review",
    category: "Core",
    description: "Pause and request approval before a sensitive step.",
  },
  {
    kind: "editor.sticky_note",
    label: "Sticky note",
    category: "Editor",
    description: "Add a freeform text annotation to the canvas.",
  },
];

interface DefaultNodeArgs {
  readonly kind: string;
  readonly id: string;
  readonly position: { readonly x: number; readonly y: number };
}

// Returns a minimum-valid node for the given kind. Returns null for kinds
// the catalog doesn't cover yet; callers should treat that as "not in the palette."
export function defaultNodeForKind(args: DefaultNodeArgs): WorkflowNodeInput | null {
  const base = { id: args.id, type: args.kind, position: args.position };
  switch (args.kind) {
    case "trigger.manual":
      return { ...base, params: {} };
    case "trigger.cron":
      return { ...base, params: { expression: "0 9 * * *", timezone: "UTC" } };
    case "trigger.webhook":
      return {
        ...base,
        params: {
          method: "POST",
          verifySignature: false,
          responseMode: "on_received",
          endpointSlug: `webhook-${args.id.slice(0, 6)}`,
        },
      };
    case "trigger.chat_message":
      return { ...base, params: { channels: [{ kind: "web" }] } };
    case "core.http_request":
      return {
        ...base,
        params: {
          method: "GET",
          url: "https://example.com",
          headers: {},
          query: {},
          body: null,
        },
      };
    case "core.code":
      return {
        ...base,
        params: {
          language: "typescript",
          source: "return { message: 'hello' };",
          timeoutSec: 10,
          memoryMb: 128,
        },
      };
    case "core.tool_call":
      return {
        ...base,
        params: { mcpServerId: "mcp_placeholder", toolName: "tool", parameters: {} },
      };
    case "ai.agent":
      return {
        ...base,
        params: {
          systemPrompt: "You are a helpful assistant.",
          userPromptTemplate: "{{ $json.text }}",
          maxIterations: 5,
          outputMode: "text",
        },
      };
    case "ai.language_model":
      return {
        ...base,
        params: {
          provider: "anthropic",
          model: "claude-haiku-4-5",
          temperature: 0.7,
          maxTokens: 1024,
        },
      };
    case "ai.memory":
      return {
        ...base,
        params: { strategy: "buffer_window", contextWindowLength: 5, sessionKeyExpression: null },
      };
    case "flow.if":
      return {
        ...base,
        params: {
          conditions: [
            {
              id: `cond_${args.id.slice(0, 6)}`,
              leftValue: "{{ $json.x }}",
              operator: "equals",
              rightValue: true,
            },
          ],
          combinator: "and",
        },
      };
    case "flow.switch":
      return {
        ...base,
        params: {
          mode: "expression",
          cases: [{ when: "{{ $json.x === 'a' }}", outputIndex: 0 }],
          defaultOutputIndex: 1,
        },
      };
    case "flow.loop":
      return {
        ...base,
        params: { mode: "for_each", iterableExpression: "{{ $json.items }}", batchSize: 1 },
      };
    case "flow.merge":
      return { ...base, params: { strategy: "append", keyExpression: null } };
    case "flow.wait":
      return { ...base, params: { until: { mode: "duration", ms: 5000 } } };
    case "flow.noop":
      return { ...base, params: {} };
    case "transform":
      return { ...base, params: { op: "edit_fields", config: {} } };
    case "ai.voice_agent":
      return {
        ...base,
        params: {
          direction: "inbound",
          firstMessage: "Hello, how can I help you today?",
          endCallPhrases: ["goodbye", "bye"],
          maxDurationSec: 300,
          silenceTimeoutSec: 30,
          interruptionEnabled: true,
          recordingEnabled: false,
          voiceEntry: {
            provider: "elevenlabs",
            voiceId: "21m00Tcm4TlvDq8ikWAM",
            model: "eleven_turbo_v2",
          },
          modelConnection: {
            provider: "anthropic",
            model: "claude-haiku-4-5",
            systemPrompt: "You are a helpful voice assistant.",
          },
          toolsEndpoint: {
            tools: [],
            serverUrl: "https://placeholder.mirrorverse.io/api/voice/webhook",
          },
          knowledgeBaseIds: [],
        },
      };
    case "ai.retriever":
      return { ...base, params: { knowledgeBaseId: "", topK: 6, minScore: null } };
    case "ai.output_parser":
      return { ...base, params: { strategy: "auto_fix", schema: null, autoFix: true } };
    case "human.review":
      return {
        ...base,
        params: {
          channel: { kind: "chat" },
          promptTemplate: "Please review and approve to continue.",
          responseSchema: null,
          timeoutSec: 3600,
          onTimeout: "abort",
          defaultValue: null,
        },
      };
    case "editor.sticky_note":
      return { ...base, params: { content: "", width: 200, height: 120, color: 0 } };
    default:
      return null;
  }
}
