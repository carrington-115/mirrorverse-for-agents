-- 0008: add audit_log table for workspace event tracking.
-- Additive only; safe to run on a populated DB.

CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" text PRIMARY KEY NOT NULL,
  "workspace_id" text,
  "user_id" text NOT NULL,
  "action" text NOT NULL,
  "target_kind" text,
  "target_id" text,
  "payload" jsonb,
  "ip" text,
  "user_agent" text,
  "ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "audit_log"
    ADD CONSTRAINT "audit_log_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id")
    ON DELETE cascade ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "audit_log_workspace_ts_idx"
  ON "audit_log" USING btree ("workspace_id", "ts");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "audit_log_user_idx"
  ON "audit_log" USING btree ("user_id");
