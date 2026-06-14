ALTER TABLE "chats" ADD COLUMN "secondary_workflow_id" text;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_secondary_workflow_id_workflows_id_fk" FOREIGN KEY ("secondary_workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chats_secondary_workflow_idx" ON "chats" USING btree ("secondary_workflow_id");