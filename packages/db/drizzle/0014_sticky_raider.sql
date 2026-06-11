ALTER TABLE "usage_events" ADD COLUMN "credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_period_aggregates" ADD COLUMN "total_credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
-- Backfill historical rows: 1 credit = 5000 microcents ($0.0005) of underlying COGS.
-- Keep in sync with MICROCENTS_PER_CREDIT in packages/agent/src/billing/credits.ts.
UPDATE "usage_events" SET "credits" = ROUND("cost_cents" * 10000.0 / 5000);--> statement-breakpoint
UPDATE "usage_period_aggregates" SET "total_credits" = ROUND("total_cost_cents" * 10000.0 / 5000);