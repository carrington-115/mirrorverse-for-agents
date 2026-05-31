import type {
  AgentSkillAttachmentId,
  AgentSkillId,
  AgentSkillVersionId,
  ChatId,
  JsonObject,
  McpServerId,
  Tenanted,
  Timestamps,
  UserId,
  WorkflowId,
} from "./common.js";

export type SkillVisibility = "public" | "team" | "private";

/**
 * Reusable bundle of agent behavior: instructions + required tools + I/O
 * schema. The product ships a starter library (workspaceId null = global)
 * for performance — the orchestrator picks one up rather than reasoning
 * from scratch every time. Users can fork / author their own.
 */
export interface AgentSkill extends Timestamps {
  readonly id: AgentSkillId;
  // Null = global / built-in skill we ship; non-null = workspace-owned.
  readonly workspaceId: Tenanted["workspaceId"] | null;
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  readonly currentVersionId: AgentSkillVersionId;
  readonly visibility: SkillVisibility;
  readonly icon: string | null;
  readonly tags: readonly string[];
  readonly ownerId: UserId | null;
  readonly installCount: number;
  readonly forkedFromId: AgentSkillId | null;
}

/**
 * Immutable skill snapshot. Versioned so existing attachments don't break
 * when the skill is edited.
 */
export interface AgentSkillVersion extends Timestamps {
  readonly id: AgentSkillVersionId;
  readonly skillId: AgentSkillId;
  readonly versionNumber: number;
  readonly instructions: string;
  readonly requiredTools: readonly {
    readonly mcpServerId: McpServerId;
    readonly toolName: string;
  }[];
  readonly requiredCredentials: readonly { readonly appSlug: string }[];
  readonly inputSchema: JsonObject | null;
  readonly outputSchema: JsonObject | null;
  readonly publishedAt: Date | null;
  readonly publishedBy: UserId | null;
  readonly changelog: string | null;
}

/**
 * A skill bound to a scope. The orchestrator merges instructions + required
 * tools from every attached skill into the next agent call.
 */
export interface AgentSkillAttachment {
  readonly id: AgentSkillAttachmentId;
  readonly skillId: AgentSkillId;
  readonly skillVersionId: AgentSkillVersionId;
  readonly scope: SkillAttachmentScope;
  readonly attachedAt: Date;
  readonly attachedBy: UserId | null;
}

export type SkillAttachmentScope =
  | { readonly kind: "chat"; readonly chatId: ChatId }
  | { readonly kind: "workflow"; readonly workflowId: WorkflowId }
  | { readonly kind: "workspace"; readonly workspaceId: Tenanted["workspaceId"] };
