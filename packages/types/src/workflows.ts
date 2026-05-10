import type {
  ChatId,
  JsonObject,
  JsonValue,
  McpServerId,
  Tenanted,
  Timestamps,
  UserId,
  WebhookEndpointId,
  WorkflowId,
  WorkflowTriggerId,
  WorkflowVersionId,
} from "./common";
import type { DeployedAgent } from "./agent-definition";

export type WorkflowKind = "automation" | "voice-agent" | "chat-agent" | "code";
export type WorkflowStatus = "draft" | "active" | "paused" | "archived";

/**
 * A workflow the user owns. The current `WorkflowVersion` holds the actual
 * canvas/document; `Workflow` is the stable identity across versions.
 */
export interface Workflow extends Timestamps, Tenanted {
  readonly id: WorkflowId;
  readonly name: string;
  readonly description: string | null;
  readonly kind: WorkflowKind;
  readonly status: WorkflowStatus;
  readonly currentVersionId: WorkflowVersionId | null;
  readonly createdBy: UserId;
  readonly tags: readonly string[];
}

/**
 * Immutable snapshot. Every save creates a new version.
 *
 * - `document` is the source-of-truth canvas the user edits.
 * - `compiledAgent` is the flat declarative artifact derived from the canvas
 *   for `chat-agent` / `voice-agent` kinds — what the runtime (Anthropic /
 *   Vapi / Retell) actually consumes.
 */
export interface WorkflowVersion extends Timestamps, Tenanted {
  readonly id: WorkflowVersionId;
  readonly workflowId: WorkflowId;
  readonly versionNumber: number;
  readonly document: WorkflowDocument;
  readonly compiledAgent: DeployedAgent | null;
  readonly createdBy: UserId;
  readonly generatedByChatId: ChatId | null;
  readonly summary: string | null;
  readonly checksum: string;
}

/**
 * Canvas-level workflow definition. Discriminated by `kind`. Mirrors the n8n
 * shape: nodes + typed connections + settings, with sticky notes and AI
 * composables (model, memory, tools, output parser) as first-class nodes.
 */
export type WorkflowDocument =
  | AutomationDocument
  | VoiceAgentDocument
  | ChatAgentDocument
  | CodeDocument;

interface DocumentBase {
  readonly schemaVersion: 1;
  readonly metadata: {
    readonly title: string;
    readonly description: string | null;
    readonly notes: string | null;
  };
  readonly settings: WorkflowSettings;
  readonly nodes: readonly WorkflowNode[];
  readonly connections: readonly WorkflowConnection[];
  readonly variables: Readonly<Record<string, JsonValue>>;
  readonly staticData: JsonObject | null;
}

export interface AutomationDocument extends DocumentBase {
  readonly kind: "automation";
}

export interface VoiceAgentDocument extends DocumentBase {
  readonly kind: "voice-agent";
}

export interface ChatAgentDocument extends DocumentBase {
  readonly kind: "chat-agent";
}

export interface CodeDocument extends DocumentBase {
  readonly kind: "code";
  readonly entrypointNodeId: string;
}

export interface WorkflowSettings {
  readonly executionOrder: "v1";
  readonly binaryMode: "memory" | "separate";
  readonly errorWorkflowId: WorkflowId | null;
  readonly timezone: string;
  readonly executionTimeoutSec: number | null;
  readonly saveExecutionProgress: boolean;
  readonly saveDataSuccessExecution: "all" | "none";
  readonly saveDataErrorExecution: "all" | "none";
}

/**
 * Typed connection channels between nodes.
 *
 * `main` carries data flow (the regular pipeline). `ai_*` channels compose
 * an `AgentNode` with its language model, memory, tools, retriever, and
 * output parser — each filled by a dedicated node connected to that slot.
 */
export type ConnectionKind =
  | "main"
  | "ai_languageModel"
  | "ai_memory"
  | "ai_tool"
  | "ai_outputParser"
  | "ai_retriever"
  | "ai_chain";

export interface WorkflowConnection {
  readonly id: string;
  readonly kind: ConnectionKind;
  readonly fromNodeId: string;
  readonly fromOutputIndex: number;
  readonly toNodeId: string;
  readonly toInputIndex: number;
  readonly condition: string | null;
}

/**
 * Parameter binding mode.
 *
 * - `static` — literal value, encoded inline.
 * - `expression` — `{{ $json.foo }}`-style template evaluated at run time.
 * - `from_ai` — placeholder for n8n's `$fromAI('paramName', 'description')`:
 *   when the node is invoked as a tool by an `AgentNode`, the agent fills
 *   in this parameter from the conversation context.
 */
export type ParameterValue =
  | { readonly mode: "static"; readonly value: JsonValue }
  | { readonly mode: "expression"; readonly expr: string }
  | {
      readonly mode: "from_ai";
      readonly name: string;
      readonly description: string;
      readonly type: "string" | "number" | "boolean" | "json";
      readonly required: boolean;
    };

export type ParameterMap = Readonly<Record<string, ParameterValue>>;

/**
 * Every node on the canvas. Discriminated by `kind`. Covers triggers, core
 * ops, AI composables, control flow, data transforms, human-in-the-loop,
 * skill calls, and editor-only sticky notes.
 */
export type WorkflowNode =
  | ManualTriggerNode
  | CronTriggerNode
  | WebhookTriggerNode
  | AppEventTriggerNode
  | FormTriggerNode
  | ChatMessageTriggerNode
  | SubWorkflowTriggerNode
  | ToolCallNode
  | HttpRequestNode
  | CodeNode
  | SubWorkflowCallNode
  | RespondToWebhookNode
  | AgentNode
  | LanguageModelNode
  | MemoryNode
  | OutputParserNode
  | RetrieverNode
  | IfNode
  | SwitchNode
  | LoopNode
  | MergeNode
  | FilterNode
  | WaitNode
  | StopNode
  | NoopNode
  | TransformNode
  | HumanReviewNode
  | SkillCallNode
  | StickyNoteNode;

interface NodeBase {
  readonly id: string;
  readonly name: string;
  readonly position: { readonly x: number; readonly y: number };
  /** `<scope>.<kind>` identifier (e.g. `mirrorverse.tool_call`). */
  readonly type: string;
  readonly typeVersion: number;
  readonly notes: string | null;
  readonly disabled: boolean;
  readonly continueOnFail: boolean;
}

export interface ManualTriggerNode extends NodeBase {
  readonly kind: "trigger.manual";
}

export interface CronTriggerNode extends NodeBase {
  readonly kind: "trigger.cron";
  readonly expression: string;
  readonly timezone: string;
}

export interface WebhookTriggerNode extends NodeBase {
  readonly kind: "trigger.webhook";
  readonly endpointSlug: string;
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly verifySignature: boolean;
  readonly responseMode: "on_received" | "last_node" | "respond_to_webhook_node";
  readonly webhookId: string;
}

export interface AppEventTriggerNode extends NodeBase {
  readonly kind: "trigger.app_event";
  readonly mcpServerId: McpServerId;
  readonly eventName: string;
  readonly filters: ParameterMap;
  readonly webhookId: string;
}

export interface FormTriggerNode extends NodeBase {
  readonly kind: "trigger.form";
  readonly formSchema: JsonObject;
  readonly webhookId: string;
}

export interface ChatMessageTriggerNode extends NodeBase {
  readonly kind: "trigger.chat_message";
  readonly channels: readonly ChatChannel[];
}

export interface SubWorkflowTriggerNode extends NodeBase {
  readonly kind: "trigger.sub_workflow";
  readonly inputSchema: JsonObject | null;
}

export type ChatChannel =
  | { readonly kind: "web" }
  | { readonly kind: "slack"; readonly channelId: string }
  | { readonly kind: "discord"; readonly channelId: string }
  | { readonly kind: "telegram"; readonly chatId: string }
  | { readonly kind: "whatsapp"; readonly waba: string };

/**
 * Calls a tool from an MCP server. The same node represents both an inline
 * action (executed in `main` flow) and an AI-callable tool — toggled by
 * `toolMode`. When `toolMode` is true the node is exposed to a connected
 * `AgentNode` over an `ai_tool` connection.
 */
export interface ToolCallNode extends NodeBase {
  readonly kind: "core.tool_call";
  readonly mcpServerId: McpServerId;
  readonly toolName: string;
  readonly parameters: ParameterMap;
  readonly retry: RetryPolicy;
  readonly toolMode: boolean;
}

export interface HttpRequestNode extends NodeBase {
  readonly kind: "core.http_request";
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
  readonly url: ParameterValue;
  readonly headers: ParameterMap;
  readonly query: ParameterMap;
  readonly body: ParameterValue | null;
  readonly authentication: HttpAuth | null;
  readonly retry: RetryPolicy;
}

export type HttpAuth =
  | { readonly kind: "none" }
  | { readonly kind: "basic"; readonly username: string; readonly password: string }
  | { readonly kind: "bearer"; readonly token: string }
  | { readonly kind: "header"; readonly headerName: string; readonly headerValue: string }
  | { readonly kind: "oauth2"; readonly connectionId: string };

export interface CodeNode extends NodeBase {
  readonly kind: "core.code";
  readonly language: "typescript" | "python";
  readonly source: string;
  readonly timeoutSec: number;
  readonly memoryMb: number;
  readonly networkAllowlist: readonly string[];
}

export interface SubWorkflowCallNode extends NodeBase {
  readonly kind: "core.sub_workflow";
  readonly workflowId: WorkflowId;
  readonly inputs: ParameterMap;
}

export interface RespondToWebhookNode extends NodeBase {
  readonly kind: "core.respond_to_webhook";
  readonly status: number;
  readonly headers: ParameterMap;
  readonly body: ParameterValue;
}

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoff: "exponential" | "linear" | "none";
  readonly initialDelayMs: number;
}

/**
 * The orchestrator node. Declares slots that other nodes fill via
 * `ai_languageModel`, `ai_memory`, `ai_tool`, `ai_retriever`, and
 * `ai_outputParser` connections.
 */
export interface AgentNode extends NodeBase {
  readonly kind: "ai.agent";
  readonly systemPrompt: string;
  readonly userPromptTemplate: ParameterValue;
  readonly maxIterations: number;
  readonly outputMode: "text" | "structured";
  readonly outputSchema: JsonObject | null;
}

export interface LanguageModelNode extends NodeBase {
  readonly kind: "ai.language_model";
  readonly provider: "anthropic" | "openai" | "google" | "mistral" | "meta";
  readonly model: string;
  readonly options: {
    readonly temperature: number;
    readonly maxTokens: number;
    readonly topP: number | null;
    readonly stopSequences: readonly string[];
  };
}

export interface MemoryNode extends NodeBase {
  readonly kind: "ai.memory";
  readonly strategy: "buffer_window" | "summary_buffer" | "vector_retrieval" | "postgres_chat";
  readonly contextWindowLength: number;
  readonly sessionKeyExpression: string | null;
}

export interface OutputParserNode extends NodeBase {
  readonly kind: "ai.output_parser";
  readonly strategy: "json_schema" | "structured" | "auto_fix" | "regex";
  readonly schema: JsonObject | null;
  readonly autoFix: boolean;
}

export interface RetrieverNode extends NodeBase {
  readonly kind: "ai.retriever";
  readonly knowledgeBaseId: string;
  readonly topK: number;
  readonly minScore: number | null;
}

export interface IfNode extends NodeBase {
  readonly kind: "flow.if";
  readonly conditions: readonly Condition[];
  readonly combinator: "and" | "or";
}

export interface Condition {
  readonly id: string;
  readonly leftValue: ParameterValue;
  readonly rightValue: ParameterValue;
  readonly operator: ConditionOperator;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "starts_with"
  | "ends_with"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "regex_match";

export interface SwitchNode extends NodeBase {
  readonly kind: "flow.switch";
  readonly mode: "expression" | "rules";
  readonly cases: readonly { readonly when: string; readonly outputIndex: number }[];
  readonly defaultOutputIndex: number | null;
}

export interface LoopNode extends NodeBase {
  readonly kind: "flow.loop";
  readonly mode: "split_in_batches" | "for_each" | "parallel";
  readonly iterableExpression: string;
  readonly batchSize: number;
}

export interface MergeNode extends NodeBase {
  readonly kind: "flow.merge";
  readonly strategy: "append" | "merge_by_key" | "wait_all" | "multiplex";
  readonly keyExpression: string | null;
}

export interface FilterNode extends NodeBase {
  readonly kind: "flow.filter";
  readonly conditions: readonly Condition[];
  readonly combinator: "and" | "or";
}

export interface WaitNode extends NodeBase {
  readonly kind: "flow.wait";
  readonly until:
    | { readonly mode: "duration"; readonly ms: number }
    | { readonly mode: "timestamp"; readonly iso: string }
    | { readonly mode: "expression"; readonly expr: string }
    | { readonly mode: "webhook"; readonly endpointSlug: string };
}

export interface StopNode extends NodeBase {
  readonly kind: "flow.stop";
  readonly errorMessage: string | null;
}

export interface NoopNode extends NodeBase {
  readonly kind: "flow.noop";
}

export type TransformOp =
  | "edit_fields"
  | "aggregate"
  | "summarize"
  | "limit"
  | "sort"
  | "rename_keys"
  | "remove_duplicates"
  | "split_out"
  | "compare_datasets"
  | "ai_transform";

export interface TransformNode extends NodeBase {
  readonly kind: "transform";
  readonly op: TransformOp;
  readonly config: JsonObject;
}

export type HumanReviewChannel =
  | { readonly kind: "chat" }
  | { readonly kind: "email"; readonly to: string }
  | { readonly kind: "slack"; readonly channel: string }
  | { readonly kind: "discord"; readonly channel: string }
  | { readonly kind: "telegram"; readonly chatId: string }
  | { readonly kind: "whatsapp"; readonly to: string }
  | { readonly kind: "teams"; readonly channelId: string }
  | { readonly kind: "outlook"; readonly to: string }
  | { readonly kind: "google_chat"; readonly space: string };

export interface HumanReviewNode extends NodeBase {
  readonly kind: "human.review";
  readonly channel: HumanReviewChannel;
  readonly promptTemplate: ParameterValue;
  readonly responseSchema: JsonObject | null;
  readonly timeoutSec: number;
  readonly onTimeout: "abort" | "continue" | "default";
  readonly defaultValue: JsonValue | null;
}

export interface SkillCallNode extends NodeBase {
  readonly kind: "skill.call";
  readonly skillSlug: string;
  readonly skillVersionNumber: number | null;
  readonly inputs: ParameterMap;
}

export interface StickyNoteNode extends NodeBase {
  readonly kind: "editor.sticky_note";
  readonly content: string;
  readonly width: number;
  readonly height: number;
  readonly color: number;
}

/** Live registration of a trigger with the execution engine (Inngest). */
export interface WorkflowTriggerRegistration extends Timestamps, Tenanted {
  readonly id: WorkflowTriggerId;
  readonly workflowId: WorkflowId;
  readonly workflowVersionId: WorkflowVersionId;
  readonly triggerNodeId: string;
  readonly inngestFunctionId: string | null;
  readonly enabled: boolean;
  readonly lastFiredAt: Date | null;
}

export interface WebhookEndpoint extends Timestamps, Tenanted {
  readonly id: WebhookEndpointId;
  readonly workflowId: WorkflowId;
  readonly triggerNodeId: string;
  readonly slug: string;
  readonly secret: string;
  readonly enabled: boolean;
  readonly lastCalledAt: Date | null;
  readonly callsLast24h: number;
}
