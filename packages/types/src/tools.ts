import type {
  ChatId,
  ConnectionId,
  ConnectionRequestId,
  JsonObject,
  McpDirectoryEntryId,
  McpServerId,
  Tenanted,
  Timestamps,
  ToolId,
  UserId,
} from "./common.js";

export type McpServerKind = "first_party" | "composio" | "pipedream" | "klavis" | "user_supplied";
export type McpTransport = "http" | "sse" | "stdio" | "websocket";

/**
 * A registered MCP server. The same row covers our own first-party servers,
 * a catalog provider (Composio / Pipedream / Klavis) the workspace has paid
 * for, and a fully user-supplied URL. `workspaceId === null` marks a global
 * / built-in server available to every tenant.
 */
export interface McpServer extends Timestamps {
  readonly id: McpServerId;
  readonly workspaceId: Tenanted["workspaceId"] | null;
  /** Points to the cached Anthropic directory entry when this server was activated from the directory. */
  readonly directoryEntryId: McpDirectoryEntryId | null;
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly kind: McpServerKind;
  readonly transport: McpTransport;
  readonly url: string | null;
  readonly authConfigEncrypted: string | null;
  readonly enabled: boolean;
  readonly toolsLastSyncedAt: Date | null;
  readonly addedBy: UserId | null;
  readonly icon: string | null;
}

/** Cached tool descriptor. Refreshed periodically from the MCP server. */
export interface Tool extends Timestamps {
  readonly id: ToolId;
  readonly mcpServerId: McpServerId;
  readonly name: string;
  readonly displayName: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly inputSchema: JsonObject;
  readonly outputSchema: JsonObject | null;
  readonly requiresCredential: boolean;
  readonly tags: readonly string[];
  readonly deprecated: boolean;
}

export type ToolCategory =
  | "messaging"
  | "email"
  | "scheduling"
  | "crm"
  | "files"
  | "ai"
  | "data"
  | "dev"
  | "finance"
  | "marketing"
  | "social"
  | "voice"
  | "ecommerce"
  | "support"
  | "productivity"
  | "search"
  | "core"
  | "other";

export type ConnectionStatus = "pending" | "active" | "expired" | "revoked" | "failed";

export type CredentialKind = "oauth2" | "api_key" | "bearer" | "basic" | "custom";

/**
 * A tenant's authorized credential for an integration. For Composio /
 * Pipedream-managed connections we don't store the secret ourselves —
 * we keep the provider's account reference in `externalAccountId` and let
 * them broker access.
 */
export interface Connection extends Timestamps, Tenanted {
  readonly id: ConnectionId;
  readonly mcpServerId: McpServerId;
  readonly appSlug: string;
  readonly displayName: string;
  readonly status: ConnectionStatus;
  readonly credentialKind: CredentialKind;
  readonly externalAccountId: string | null;
  readonly credentialEncrypted: string | null;
  readonly scopes: readonly string[];
  readonly accountEmail: string | null;
  readonly expiresAt: Date | null;
  readonly lastUsedAt: Date | null;
  readonly createdBy: UserId;
}

export type ConnectionRequestStatus = "pending" | "completed" | "expired" | "cancelled";

/**
 * Drives the v0-style "connect this app" popup flow. Created when the agent
 * needs a credential it doesn't have; resolved when the user completes the
 * OAuth dance and the resume event fires.
 */
export interface ConnectionRequest extends Timestamps, Tenanted {
  readonly id: ConnectionRequestId;
  readonly chatId: ChatId | null;
  readonly mcpServerId: McpServerId;
  readonly appSlug: string;
  readonly redirectUrl: string;
  readonly resumeEventName: string;
  readonly status: ConnectionRequestStatus;
  readonly resolvedConnectionId: ConnectionId | null;
  readonly expiresAt: Date;
}
