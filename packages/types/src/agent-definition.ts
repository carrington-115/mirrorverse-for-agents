import type { JsonObject } from "./common";

/**
 * Flat declarative artifact a `WorkflowDocument` compiles to when its kind
 * is `chat-agent` or `voice-agent`. Mirrors Anthropic's Agent JSON shape
 * so it can be handed straight to the Anthropic API; the `voice` overlay
 * carries the extra fields Vapi/Retell need.
 *
 * The canvas/graph form lives in `workflows.ts`. The compiler walks the
 * graph, collapses memory/model/tool/parser slots, and emits one of these.
 */
export interface DeployedAgent {
  readonly name: string;
  readonly description: string;
  readonly model: string;
  readonly system: string;
  readonly mcpServers: readonly McpServerRef[];
  readonly tools: readonly AgentTool[];
  readonly metadata: JsonObject;
  readonly voice: VoiceConfig | null;
  readonly memory: AgentMemoryConfig | null;
  readonly outputSchema: JsonObject | null;
}

export type McpServerType = "url" | "stdio" | "sse";

export interface McpServerRef {
  readonly name: string;
  readonly url: string;
  readonly type: McpServerType;
  readonly headers: Readonly<Record<string, string>> | null;
}

/**
 * Tool entries on a deployed agent.
 *
 * - `agent_toolset` exposes Anthropic's built-in toolbelt (web search, code
 *   execution, file ops, computer use), versioned by date.
 * - `mcp_toolset` exposes every tool from a named MCP server.
 * - `single_mcp_tool` exposes one specific tool from an MCP server.
 */
export type AgentTool = AgentToolset | McpToolset | SingleMcpTool;

export interface AgentToolset {
  readonly type: "agent_toolset";
  readonly version: string;
  readonly enabled: readonly AgentBuiltinTool[];
}

export type AgentBuiltinTool =
  | "web_search"
  | "code_execution"
  | "file_read"
  | "file_write"
  | "computer_use";

export interface McpToolset {
  readonly type: "mcp_toolset";
  readonly mcpServerName: string;
  readonly defaultConfig: McpToolsetConfig;
  readonly allowedTools: readonly string[] | null;
  readonly blockedTools: readonly string[] | null;
}

export interface SingleMcpTool {
  readonly type: "single_mcp_tool";
  readonly mcpServerName: string;
  readonly toolName: string;
  readonly config: McpToolsetConfig;
}

export interface McpToolsetConfig {
  readonly permissionPolicy: PermissionPolicy;
  readonly timeoutMs: number | null;
  readonly maxConcurrentCalls: number | null;
}

export type PermissionPolicy =
  | { readonly type: "always_allow" }
  | { readonly type: "always_deny" }
  | { readonly type: "ask"; readonly defaultAction: "allow" | "deny" }
  | { readonly type: "rule_based"; readonly rules: readonly PermissionRule[] };

export interface PermissionRule {
  readonly when: string;
  readonly action: "allow" | "deny" | "ask";
}

/** Voice-runtime overlay. Present only on voice-agent kind. */
export interface VoiceConfig {
  readonly direction: "inbound" | "outbound";
  readonly provider: "vapi" | "retell" | "elevenlabs";
  readonly voiceId: string;
  readonly firstMessage: string;
  readonly endCallPhrases: readonly string[];
  readonly maxDurationSec: number;
  readonly silenceTimeoutSec: number;
  readonly responseDelayMs: number;
  readonly interruptionEnabled: boolean;
  readonly recordingEnabled: boolean;
  readonly transcriber: {
    readonly provider: "deepgram" | "assembly_ai" | "whisper";
    readonly model: string;
    readonly language: string;
  };
  readonly tts: {
    readonly provider: "elevenlabs" | "cartesia" | "openai" | "playht";
    readonly model: string;
  };
}

export type AgentMemoryConfig =
  | { readonly kind: "none" }
  | { readonly kind: "buffer_window"; readonly windowLength: number }
  | { readonly kind: "summary_buffer"; readonly maxTokens: number }
  | {
      readonly kind: "vector_retrieval";
      readonly knowledgeBaseId: string;
      readonly topK: number;
    }
  | {
      readonly kind: "postgres_chat";
      readonly sessionKeyExpression: string;
      readonly retentionDays: number;
    };
