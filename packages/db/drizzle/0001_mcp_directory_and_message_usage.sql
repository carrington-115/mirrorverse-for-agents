-- 0001: cache Anthropic's MCP directory + add raw usage to messages.
-- Additive only; safe to run on a populated DB.

ALTER TABLE "messages"
  ADD COLUMN IF NOT EXISTS "usage" jsonb;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "mcp_directory_entries" (
  "id" text PRIMARY KEY NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "display_name" text NOT NULL,
  "one_liner" text,
  "description" text,
  "author_name" text,
  "author_url" text,
  "icon_url" text,
  "logo" text,
  "documentation_url" text,
  "support_url" text,
  "privacy_policy_url" text,
  "type" text NOT NULL,
  "source" text,
  "source_feed" text,
  "categories" text[] DEFAULT '{}'::text[] NOT NULL,
  "tool_names" text[] DEFAULT '{}'::text[] NOT NULL,
  "prompt_names" text[] DEFAULT '{}'::text[] NOT NULL,
  "works_with" text[] DEFAULT '{}'::text[] NOT NULL,
  "visibility" text[] DEFAULT '{}'::text[] NOT NULL,
  "remote" jsonb,
  "local" jsonb,
  "permissions" text,
  "has_mcp_app" boolean DEFAULT false NOT NULL,
  "claude_code_copy_text" text,
  "directory_url" text,
  "background_pattern" text,
  "server_label" text,
  "sort_order" integer,
  "rank" integer,
  "popularity_score" integer,
  "trending_score" integer,
  "added_at" date,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "raw" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "mcp_directory_entries_slug_idx"
  ON "mcp_directory_entries" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_directory_entries_popularity_idx"
  ON "mcp_directory_entries" ("popularity_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_directory_entries_trending_idx"
  ON "mcp_directory_entries" ("trending_score");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mcp_directory_entries_type_idx"
  ON "mcp_directory_entries" ("type");
--> statement-breakpoint

ALTER TABLE "mcp_servers"
  ADD COLUMN IF NOT EXISTS "directory_entry_id" text;
--> statement-breakpoint

ALTER TABLE "mcp_servers"
  ADD CONSTRAINT "mcp_servers_directory_entry_id_fk"
  FOREIGN KEY ("directory_entry_id") REFERENCES "mcp_directory_entries"("id")
  ON DELETE SET NULL;
