CREATE TABLE "invoices" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"stripe_invoice_id" text NOT NULL,
	"subscription_id" text,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"amount_paid_cents" integer DEFAULT 0 NOT NULL,
	"amount_due_cents" integer DEFAULT 0 NOT NULL,
	"hosted_invoice_url" text,
	"invoice_pdf_url" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"stripe_product_id" text DEFAULT '' NOT NULL,
	"stripe_monthly_price_id" text,
	"stripe_annual_price_id" text,
	"monthly_price_cents" integer DEFAULT 0 NOT NULL,
	"annual_price_cents" integer DEFAULT 0 NOT NULL,
	"limits" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_customer_id" text DEFAULT '' NOT NULL,
	"plan_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"trial_ends_at" timestamp with time zone,
	"default_payment_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscriptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "usage_period_aggregates" (
	"workspace_id" text NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"granularity" text NOT NULL,
	"kind" text NOT NULL,
	"total_quantity" bigint DEFAULT 0 NOT NULL,
	"total_cost_cents" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "usage_period_aggregates_workspace_id_period_start_granularity_kind_pk" PRIMARY KEY("workspace_id","period_start","granularity","kind")
);
--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "usage_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chat_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "chats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "api_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invitations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workflow_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workflows" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workflow_run_steps" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workflow_runs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "connection_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "connections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "mcp_servers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_skill_attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_skill_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "agent_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "phone_numbers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_agents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_calls" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "voice_twilio_creds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "webhooks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_bases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "knowledge_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_period_aggregates" ADD CONSTRAINT "usage_period_aggregates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_stripe_id_idx" ON "invoices" USING btree ("stripe_invoice_id");--> statement-breakpoint
CREATE INDEX "invoices_workspace_idx" ON "invoices" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_stripe_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_workspace_idx" ON "subscriptions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "usage_agg_workspace_period_idx" ON "usage_period_aggregates" USING btree ("workspace_id","period_start");--> statement-breakpoint
CREATE POLICY "audit_log_tenant_isolation" ON "audit_log" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "usage_events_tenant_isolation" ON "usage_events" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "chat_events_tenant_isolation" ON "chat_events" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from chats where chats.id = chat_events.chat_id and chats.workspace_id = current_setting('app.current_workspace', true))) WITH CHECK (exists (select 1 from chats where chats.id = chat_events.chat_id and chats.workspace_id = current_setting('app.current_workspace', true)));--> statement-breakpoint
CREATE POLICY "chats_tenant_isolation" ON "chats" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "messages_tenant_isolation" ON "messages" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from chats where chats.id = messages.chat_id and chats.workspace_id = current_setting('app.current_workspace', true))) WITH CHECK (exists (select 1 from chats where chats.id = messages.chat_id and chats.workspace_id = current_setting('app.current_workspace', true)));--> statement-breakpoint
CREATE POLICY "api_keys_tenant_isolation" ON "api_keys" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "invitations_tenant_isolation" ON "invitations" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "workspace_members_tenant_isolation" ON "workspace_members" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "workflow_versions_tenant_isolation" ON "workflow_versions" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "workflows_tenant_isolation" ON "workflows" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "workflow_run_steps_tenant_isolation" ON "workflow_run_steps" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "workflow_runs_tenant_isolation" ON "workflow_runs" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "connection_requests_tenant_isolation" ON "connection_requests" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "connections_tenant_isolation" ON "connections" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "mcp_servers_tenant_isolation" ON "mcp_servers" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true) or workspace_id is null) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "agent_skill_attachments_tenant_isolation" ON "agent_skill_attachments" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from agent_skills where agent_skills.id = agent_skill_attachments.skill_id and (agent_skills.workspace_id = current_setting('app.current_workspace', true) or agent_skills.workspace_id is null))) WITH CHECK (exists (select 1 from agent_skills where agent_skills.id = agent_skill_attachments.skill_id and agent_skills.workspace_id = current_setting('app.current_workspace', true)));--> statement-breakpoint
CREATE POLICY "agent_skill_versions_tenant_isolation" ON "agent_skill_versions" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from agent_skills where agent_skills.id = agent_skill_versions.skill_id and (agent_skills.workspace_id = current_setting('app.current_workspace', true) or agent_skills.workspace_id is null))) WITH CHECK (exists (select 1 from agent_skills where agent_skills.id = agent_skill_versions.skill_id and agent_skills.workspace_id = current_setting('app.current_workspace', true)));--> statement-breakpoint
CREATE POLICY "agent_skills_tenant_isolation" ON "agent_skills" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true) or workspace_id is null) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "phone_numbers_tenant_isolation" ON "phone_numbers" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "voice_agents_tenant_isolation" ON "voice_agents" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "voice_calls_tenant_isolation" ON "voice_calls" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "voice_twilio_creds_tenant_isolation" ON "voice_twilio_creds" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "webhooks_tenant_isolation" ON "webhooks" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "knowledge_bases_tenant_isolation" ON "knowledge_bases" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "knowledge_chunks_tenant_isolation" ON "knowledge_chunks" AS PERMISSIVE FOR ALL TO public USING (exists (select 1 from knowledge_bases where knowledge_bases.id = knowledge_chunks.kb_id and knowledge_bases.workspace_id = current_setting('app.current_workspace', true))) WITH CHECK (exists (select 1 from knowledge_bases where knowledge_bases.id = knowledge_chunks.kb_id and knowledge_bases.workspace_id = current_setting('app.current_workspace', true)));--> statement-breakpoint
CREATE POLICY "knowledge_documents_tenant_isolation" ON "knowledge_documents" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "invoices_tenant_isolation" ON "invoices" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "subscriptions_tenant_isolation" ON "subscriptions" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));