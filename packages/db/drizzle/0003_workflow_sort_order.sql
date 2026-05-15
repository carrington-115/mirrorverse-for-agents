-- 0003: manual ordering for workflows list (drag-reorder).
-- Additive and idempotent; safe to run on populated DBs.
ALTER TABLE "workflows"
  ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;
