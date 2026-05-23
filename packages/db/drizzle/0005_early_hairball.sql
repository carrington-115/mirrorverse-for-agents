CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "knowledge_bases" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_chunks" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"document_id" text NOT NULL,
	"kb_id" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"token_count" integer DEFAULT 0 NOT NULL,
	"embedding" vector(1536) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "knowledge_documents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"kb_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"source_type" text NOT NULL,
	"source_url" text,
	"storage_key" text,
	"file_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"content_hash" text,
	"error_message" text,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "knowledge_bases" ADD CONSTRAINT "knowledge_bases_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_document_id_knowledge_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."knowledge_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_kb_id_knowledge_bases_id_fk" FOREIGN KEY ("kb_id") REFERENCES "public"."knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ADD CONSTRAINT "knowledge_documents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "knowledge_bases_workspace_idx" ON "knowledge_bases" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "knowledge_chunks_doc_chunk_idx" ON "knowledge_chunks" USING btree ("document_id","chunk_index");--> statement-breakpoint
CREATE INDEX "knowledge_chunks_kb_idx" ON "knowledge_chunks" USING btree ("kb_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_kb_idx" ON "knowledge_documents" USING btree ("kb_id");--> statement-breakpoint
CREATE INDEX "knowledge_documents_workspace_idx" ON "knowledge_documents" USING btree ("workspace_id");