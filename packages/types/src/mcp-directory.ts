import type { JsonObject, McpDirectoryEntryId, Timestamps } from "./common";

/**
 * One server from Anthropic's public MCP directory
 * (api.anthropic.com/api/directory/servers). Cached locally so the catalog
 * UI is fast and so we can attribute first-class connections to the source
 * entry. Synced periodically; `fetchedAt` reflects the last sync.
 *
 * `mcp_servers` rows reference this via `directoryEntryId` when a workspace
 * activates a directory-listed server. User-supplied servers leave it null.
 */
export interface McpDirectoryEntry extends Timestamps {
  readonly id: McpDirectoryEntryId;
  readonly slug: string;
  readonly name: string;
  readonly displayName: string;
  readonly oneLiner: string | null;
  readonly description: string | null;

  readonly author: { readonly name: string; readonly url: string | null } | null;
  readonly iconUrl: string | null;
  readonly logo: string | null;
  readonly documentationUrl: string | null;
  readonly supportUrl: string | null;
  readonly privacyPolicyUrl: string | null;

  readonly type: McpDirectoryEntryType;
  readonly source: string | null;
  readonly sourceFeed: string | null;

  readonly categories: readonly string[];
  readonly toolNames: readonly string[];
  readonly promptNames: readonly string[];
  readonly worksWith: readonly string[];
  readonly visibility: readonly string[];

  readonly remote: McpDirectoryRemoteConfig | null;
  readonly local: McpDirectoryLocalConfig | null;

  readonly permissions: string | null;
  readonly hasMcpApp: boolean;
  readonly claudeCodeCopyText: string | null;
  readonly directoryUrl: string | null;
  readonly backgroundPattern: string | null;
  readonly serverLabel: string | null;

  readonly sortOrder: number | null;
  readonly rank: number | null;
  readonly popularityScore: number | null;
  readonly trendingScore: number | null;

  readonly addedAt: Date | null;
  readonly fetchedAt: Date;
  /** Verbatim source record from Anthropic's API for forward compat. */
  readonly raw: JsonObject;
}

export type McpDirectoryEntryType = "remote" | "local";

export type McpDirectoryTransport = "streamable-http" | "sse" | "stdio";

export interface McpDirectoryRemoteConfig {
  readonly url: string | null;
  readonly urlRegex: string | null;
  readonly transport: McpDirectoryTransport;
  readonly isAuthless: boolean;
  readonly urlOptions: readonly McpDirectoryUrlOption[] | null;
}

export interface McpDirectoryUrlOption {
  readonly url: string;
  readonly label: string;
  readonly description: string | null;
}

export interface McpDirectoryLocalConfig {
  readonly version: string | null;
  readonly sizeBytes: number | null;
  readonly platforms: readonly string[];
}
