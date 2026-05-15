-- 0005: workspace_id foreign keys.
--
-- Every tenanted table's schema declares
-- `references(workspaces.id, { onDelete: "cascade" })`, but the FKs were
-- missing in live DBs because earlier migrations didn't create them. Now
-- that workspaces exists (0003_onboarding.sql), enforce them so deletes
-- cascade and orphans can't accumulate.
--
-- Pre-prod: any row pointing at a non-existent workspace gets deleted.
-- Same for nullable workspace_id (mcp_servers) — NULL is a semantic value
-- there ("global / built-in tool") and the orphans aren't global.
--
-- Additive and idempotent; safe on fresh and populated DBs.

DELETE FROM "chats"               WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "workflows"           WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "workflow_versions"   WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "workflow_runs"       WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "workflow_run_steps"  WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "usage_events"        WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "api_keys"            WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "invitations"         WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "agent_skills"        WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "connections"         WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "connection_requests" WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint
DELETE FROM "mcp_servers"         WHERE "workspace_id" IS NOT NULL AND "workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "chats" ADD CONSTRAINT "chats_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "workflow_run_steps" ADD CONSTRAINT "workflow_run_steps_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "connections" ADD CONSTRAINT "connections_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
