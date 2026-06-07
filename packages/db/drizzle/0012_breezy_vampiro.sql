CREATE TABLE "workspace_env_vars" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"value" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_env_vars" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "workspace_env_vars" ADD CONSTRAINT "workspace_env_vars_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_env_vars_name_idx" ON "workspace_env_vars" USING btree ("workspace_id","name");--> statement-breakpoint
CREATE INDEX "workspace_env_vars_workspace_idx" ON "workspace_env_vars" USING btree ("workspace_id");--> statement-breakpoint
CREATE POLICY "workspace_env_vars_tenant_isolation" ON "workspace_env_vars" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));