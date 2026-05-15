-- 0004: create usage_events table.
--
-- The table was added to the Drizzle schema (and the 0000 snapshot) in
-- commit 9e03e4e ("cost tracking via usage_events per LLM step"), but the
-- corresponding CREATE TABLE statement never made it into 0000_init.sql.
-- Databases initialised from migrations are therefore missing it, causing
-- chats.checkAdmission to fail-open and chat usage writes to be skipped.
--
-- Additive and idempotent; safe to run on populated DBs.

CREATE TABLE IF NOT EXISTS "usage_events" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
  "workspace_id" text NOT NULL,
  "kind" text NOT NULL,
  "quantity" bigint NOT NULL,
  "unit" text NOT NULL,
  "model" text,
  "cost_cents" integer DEFAULT 0 NOT NULL,
  "billable" boolean DEFAULT true NOT NULL,
  "run_id" text,
  "chat_id" text,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "idempotency_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Each FK is conditional: skip silently if it already exists, and skip with
-- a NOTICE if the referenced table is missing (some DBs were initialised
-- without the workspaces / workspace_members tables — see 0000_init.sql).
DO $$ BEGIN
  ALTER TABLE "usage_events"
    ADD CONSTRAINT "usage_events_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN
    RAISE NOTICE 'Skipping usage_events workspace FK: workspaces table does not exist.';
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "usage_events"
    ADD CONSTRAINT "usage_events_run_id_workflow_runs_id_fk"
    FOREIGN KEY ("run_id") REFERENCES "workflow_runs"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN
    RAISE NOTICE 'Skipping usage_events run FK: workflow_runs table does not exist.';
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "usage_events"
    ADD CONSTRAINT "usage_events_chat_id_chats_id_fk"
    FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_table THEN
    RAISE NOTICE 'Skipping usage_events chat FK: chats table does not exist.';
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "usage_events_idempotency_idx"
  ON "usage_events" ("workspace_id", "idempotency_key");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_workspace_occurred_idx"
  ON "usage_events" ("workspace_id", "occurred_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_chat_idx"
  ON "usage_events" ("chat_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_events_run_idx"
  ON "usage_events" ("run_id");
