ALTER TABLE "workflows" ADD COLUMN "deployed_version_id" text;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "deployed_at" timestamp with time zone;--> statement-breakpoint
-- Pin already-active workflows to the version they were running so deploys stay stable.
UPDATE "workflows" SET "deployed_version_id" = "current_version_id", "deployed_at" = now() WHERE "status" = 'active' AND "current_version_id" IS NOT NULL;
