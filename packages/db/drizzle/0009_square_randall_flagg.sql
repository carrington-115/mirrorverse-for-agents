CREATE TABLE "webhook_endpoints" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"trigger_node_id" text NOT NULL,
	"slug" text NOT NULL,
	"secret" text NOT NULL,
	"verify_signature" boolean DEFAULT false NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_called_at" timestamp with time zone,
	"calls_last_24h" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_inbound_log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"endpoint_id" text NOT NULL,
	"slug" text NOT NULL,
	"request_id" text,
	"method" text NOT NULL,
	"headers" jsonb NOT NULL,
	"body" jsonb NOT NULL,
	"status" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_inbound_log" ADD CONSTRAINT "webhook_inbound_log_endpoint_id_webhook_endpoints_id_fk" FOREIGN KEY ("endpoint_id") REFERENCES "public"."webhook_endpoints"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_endpoints_slug_idx" ON "webhook_endpoints" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_endpoints_workflow_node_idx" ON "webhook_endpoints" USING btree ("workflow_id","trigger_node_id");--> statement-breakpoint
CREATE INDEX "webhook_endpoints_workspace_idx" ON "webhook_endpoints" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_inbound_log_dedup_idx" ON "webhook_inbound_log" USING btree ("endpoint_id","request_id");--> statement-breakpoint
CREATE INDEX "webhook_inbound_log_endpoint_idx" ON "webhook_inbound_log" USING btree ("endpoint_id");--> statement-breakpoint
CREATE INDEX "webhook_inbound_log_received_idx" ON "webhook_inbound_log" USING btree ("received_at");--> statement-breakpoint
CREATE POLICY "webhook_endpoints_tenant_isolation" ON "webhook_endpoints" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));