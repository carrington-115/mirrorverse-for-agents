-- 0003: end-to-end onboarding.
--
-- Re-creates the multi-tenant tables (workspaces + workspace_members) that
-- 0000_init.sql defined but were missing in some live DBs, and adds the
-- onboarding analytics columns the setup form collects (hear_about_us,
-- role, other_role) plus the user_profiles → workspaces FK.
--
-- Additive and idempotent; safe to run on populated DBs.

CREATE TABLE IF NOT EXISTS "workspaces" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'active' NOT NULL,
  "plan_id" text NOT NULL,
  "stripe_customer_id" text,
  "billing_email" text,
  "owner_id" text NOT NULL,
  "website" text,
  "company_size" text,
  "industry" text,
  "default_apps" text[] DEFAULT '{}'::text[] NOT NULL,
  "default_deploy_channels" text[] DEFAULT '{}'::text[] NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "deleted_at" timestamp with time zone
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "workspaces_slug_idx" ON "workspaces" ("slug");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspaces_owner_idx" ON "workspaces" ("owner_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "workspace_members" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
  "workspace_id" text NOT NULL,
  "user_id" text NOT NULL,
  "role" text NOT NULL,
  "invited_by" text,
  "invited_at" timestamp with time zone,
  "accepted_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "workspace_members"
    ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "workspace_members_unique_idx"
  ON "workspace_members" ("workspace_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "workspace_members_user_idx"
  ON "workspace_members" ("user_id");
--> statement-breakpoint

ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "default_workspace_id" text;
--> statement-breakpoint
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "hear_about_us" text;
--> statement-breakpoint
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "role" text;
--> statement-breakpoint
ALTER TABLE "user_profiles"
  ADD COLUMN IF NOT EXISTS "other_role" text;
--> statement-breakpoint

-- NULL any default_workspace_id that points at a workspace this DB no longer
-- has (some envs lost the workspaces table at some point and the column was
-- left dangling). Required before adding the FK or the validation fails.
UPDATE "user_profiles"
SET "default_workspace_id" = NULL
WHERE "default_workspace_id" IS NOT NULL
  AND "default_workspace_id" NOT IN (SELECT "id" FROM "workspaces");
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "user_profiles"
    ADD CONSTRAINT "user_profiles_default_workspace_id_workspaces_id_fk"
    FOREIGN KEY ("default_workspace_id") REFERENCES "workspaces"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
