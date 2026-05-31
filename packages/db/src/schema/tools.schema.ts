import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  ConnectionRequestStatus,
  ConnectionStatus,
  CredentialKind,
  McpServerKind,
  McpTransport,
} from "@mirrorverse/types";
import { mcpDirectoryEntries } from "./mcp-directory.schema";
import { tenantOrGlobalPolicy, tenantPolicy } from "./rls";
import { workspaces } from "./tenancy.schema";

/**
 * Registered MCP server. The same row covers built-in (workspaceId null),
 * catalog providers (Composio / Pipedream / Klavis), and user-supplied URLs.
 */
export const mcpServers = pgTable(
  "mcp_servers",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    // Null = global / built-in, available to every tenant.
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    // When this server was activated from Anthropic's directory, points to
    // the cached entry so we can keep display data + tool list in sync.
    directoryEntryId: text("directory_entry_id").references(() => mcpDirectoryEntries.id, {
      onDelete: "set null",
    }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    kind: text("kind").$type<McpServerKind>().notNull(),
    transport: text("transport").$type<McpTransport>().notNull(),
    url: text("url"),
    authConfigEncrypted: text("auth_config_encrypted"),
    enabled: boolean("enabled").notNull().default(true),
    toolsLastSyncedAt: timestamp("tools_last_synced_at", { withTimezone: true }),
    addedBy: text("added_by"),
    icon: text("icon"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("mcp_servers_workspace_idx").on(t.workspaceId),
    index("mcp_servers_slug_idx").on(t.slug),
    // Built-in servers (workspaceId IS NULL) must have unique slugs.
    uniqueIndex("mcp_servers_global_slug_idx")
      .on(t.slug)
      .where(sql`workspace_id is null`),
    // Global (workspace_id IS NULL) rows readable by every tenant; writes
    // must target the active workspace.
    tenantOrGlobalPolicy("mcp_servers"),
  ],
);

/**
 * A tenant's authorized credential for an integration. For Composio /
 * Pipedream-managed connections we store only `external_account_id`; the
 * provider holds the secret. For user-supplied or first-party servers we
 * store the credential encrypted.
 */
export const connections = pgTable(
  "connections",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    mcpServerId: text("mcp_server_id")
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    appSlug: text("app_slug").notNull(),
    displayName: text("display_name").notNull(),
    status: text("status").$type<ConnectionStatus>().notNull(),
    credentialKind: text("credential_kind").$type<CredentialKind>().notNull(),
    externalAccountId: text("external_account_id"),
    credentialEncrypted: text("credential_encrypted"),
    scopes: text("scopes")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    accountEmail: text("account_email"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("connections_workspace_app_idx").on(t.workspaceId, t.appSlug),
    index("connections_workspace_server_idx").on(t.workspaceId, t.mcpServerId),
    index("connections_status_idx").on(t.status),
    tenantPolicy("connections"),
  ],
);

/**
 * Drives the credential popup flow during a chat. When the agent tries to
 * use a tool whose connection isn't present, this row is created and the
 * chat pauses; resolving it (OAuth complete / API key entered) fires
 * `resume_event_name` and the chat continues.
 */
export const connectionRequests = pgTable(
  "connection_requests",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    chatId: text("chat_id"),
    mcpServerId: text("mcp_server_id")
      .notNull()
      .references(() => mcpServers.id, { onDelete: "cascade" }),
    appSlug: text("app_slug").notNull(),
    redirectUrl: text("redirect_url").notNull(),
    resumeEventName: text("resume_event_name").notNull(),
    status: text("status").$type<ConnectionRequestStatus>().notNull().default("pending"),
    resolvedConnectionId: text("resolved_connection_id").references(() => connections.id, {
      onDelete: "set null",
    }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("connection_requests_chat_status_idx").on(t.chatId, t.status),
    // Partial index for the cleanup cron: which pending requests have expired?
    index("connection_requests_expiry_idx")
      .on(t.expiresAt)
      .where(sql`status = 'pending'`),
    tenantPolicy("connection_requests"),
  ],
);
