import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  JsonObject,
  McpDirectoryEntryType,
  McpDirectoryLocalConfig,
  McpDirectoryRemoteConfig,
} from "@mirrorverse/types";

/**
 * Cached snapshot of Anthropic's public MCP server directory
 * (api.anthropic.com/api/directory/servers). The catalog browser reads
 * from here; `mcp_servers` rows reference an entry when a workspace
 * activates one. Synced periodically — see `db:sync-directory`.
 */
export const mcpDirectoryEntries = pgTable(
  "mcp_directory_entries",
  {
    // Anthropic's UUID for the entry — kept stable across syncs.
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    displayName: text("display_name").notNull(),
    oneLiner: text("one_liner"),
    description: text("description"),

    authorName: text("author_name"),
    authorUrl: text("author_url"),
    iconUrl: text("icon_url"),
    logo: text("logo"),
    documentationUrl: text("documentation_url"),
    supportUrl: text("support_url"),
    privacyPolicyUrl: text("privacy_policy_url"),

    type: text("type").$type<McpDirectoryEntryType>().notNull(),
    source: text("source"),
    sourceFeed: text("source_feed"),

    categories: text("categories")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    toolNames: text("tool_names")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    promptNames: text("prompt_names")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    worksWith: text("works_with")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    visibility: text("visibility")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),

    remote: jsonb("remote").$type<McpDirectoryRemoteConfig | null>(),
    local: jsonb("local").$type<McpDirectoryLocalConfig | null>(),

    permissions: text("permissions"),
    hasMcpApp: boolean("has_mcp_app").notNull().default(false),
    claudeCodeCopyText: text("claude_code_copy_text"),
    directoryUrl: text("directory_url"),
    backgroundPattern: text("background_pattern"),
    serverLabel: text("server_label"),

    sortOrder: integer("sort_order"),
    rank: integer("rank"),
    popularityScore: integer("popularity_score"),
    trendingScore: integer("trending_score"),

    addedAt: date("added_at"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
    raw: jsonb("raw").$type<JsonObject>().notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("mcp_directory_entries_slug_idx").on(t.slug),
    // Catalog ranking queries: "show me the most popular productivity servers"
    index("mcp_directory_entries_popularity_idx").on(t.popularityScore),
    index("mcp_directory_entries_trending_idx").on(t.trendingScore),
    // GIN-style array containment is the right choice for `categories`/`works_with`
    // filters, but Drizzle's index helper composes a btree by default; we'll
    // promote to GIN in a follow-up migration when query volume justifies it.
    index("mcp_directory_entries_type_idx").on(t.type),
  ],
);
