ALTER TABLE "knowledge_bases" ADD COLUMN "source" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "knowledge_bases" ADD COLUMN "chat_session_id" text;--> statement-breakpoint
CREATE INDEX "knowledge_bases_session_idx" ON "knowledge_bases" USING btree ("chat_session_id");