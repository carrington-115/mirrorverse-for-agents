import type {
  ChatId,
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

export type ElevenLabsVoiceMode =
  | "conversational"
  | "narrative"
  | "emotional"
  | "advertisement"
  | "entertainment";

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
  readonly respondsToSlackMentions: boolean;
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
 *   Vapi) actually consumes.
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
 * Canvas-level workflow definition.
 *
 * Nodes carry all configuration in a free-form `params` object so the
 * document stays kind-agnostic. The node `type` field (e.g.
 * `trigger.webhook`, `ai.agent`) identifies the node kind.
 *
 * Connections are simple port-to-port wires. `fromPort` / `toPort` are
 * `"main"` for data flow, or one of the AI composable slot names
 * (`"ai_languageModel"`, `"ai_memory"`, `"ai_tool"`, `"ai_retriever"`,
 * `"ai_outputParser"`, `"voice"`) for typed AI connections.
 */
export interface WorkflowDocument {
  readonly id?: string;
  readonly name: string;
  readonly version?: number;
  readonly nodes: readonly WorkflowNode[];
  readonly connections: readonly WorkflowConnection[];
}

export interface WorkflowNode {
  readonly id: string;
  readonly type: string;
  readonly position: { readonly x: number; readonly y: number };
  readonly params: Readonly<Record<string, unknown>>;
  readonly credentialsId?: string;
}

export interface WorkflowConnection {
  readonly from: string;
  readonly fromPort: string;
  readonly to: string;
  readonly toPort: string;
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

export interface VoiceAgentToolEntry {
  readonly toolName: string;
  readonly mcpServerName: string;
}

export interface VoiceAgentToolsEndpoint {
  readonly tools: readonly VoiceAgentToolEntry[];
  readonly serverUrl: string;
}

export interface VoiceAgentModelConnection {
  readonly provider: string;
  readonly model: string;
  readonly systemPrompt: string;
}

export interface VoiceAgentVoiceEntry {
  readonly provider: string;
  readonly voiceId: string;
  readonly model: string;
  readonly voiceMode?: ElevenLabsVoiceMode;
  readonly stability?: number;
  readonly similarityBoost?: number;
  readonly style?: number;
}

export interface VoiceAgentTranscriber {
  readonly provider: string;
  readonly model: string;
  readonly language: string;
}

export interface VoiceAgentRetrieval {
  readonly topK?: number;
  readonly minScore?: number;
}

/**
 * Stored params shape for an ai.voice_agent WorkflowNode.
 * All fields live in WorkflowNode.params; VoiceAgentNode is the typed view
 * of those params (used in voice service, webhook handler, and compile step).
 */
export interface VoiceAgentNode {
  readonly direction: "inbound" | "outbound";
  readonly firstMessage: string;
  readonly endCallPhrases: readonly string[];
  readonly maxDurationSec: number;
  readonly modelConnection: VoiceAgentModelConnection;
  readonly toolsEndpoint: VoiceAgentToolsEndpoint;
  readonly voiceEntry: VoiceAgentVoiceEntry;
  readonly transcriber?: VoiceAgentTranscriber;
  readonly knowledgeBaseIds?: readonly string[];
  readonly knowledgeDocumentIds?: readonly string[];
  readonly retrieval?: VoiceAgentRetrieval;
}
