CREATE TABLE "audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"workspace_id" text,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"target_kind" text,
	"target_id" text,
	"payload" jsonb,
	"ip" text,
	"user_agent" text,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"kind" text NOT NULL,
	"quantity" bigint NOT NULL,
	"unit" text NOT NULL,
	"model" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"billable" boolean DEFAULT true NOT NULL,
	"run_id" text,
	"chat_id" text,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"chat_id" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"sequence" bigint NOT NULL,
	"ts" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"title" text,
	"workflow_id" text,
	"inngest_run_id" text,
	"model" text NOT NULL,
	"attached_skill_ids" text[] DEFAULT '{}'::text[] NOT NULL,
	"cost" jsonb NOT NULL,
	"last_message_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"chat_id" text NOT NULL,
	"role" text NOT NULL,
	"content_blocks" jsonb NOT NULL,
	"cost" jsonb NOT NULL,
	"usage" jsonb,
	"model" text,
	"stop_reason" text,
	"parent_message_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"hashed_key" text NOT NULL,
	"prefix" text NOT NULL,
	"scopes" text[] NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"full_name" text,
	"avatar_url" text,
	"default_workspace_id" text,
	"onboarding_step" text DEFAULT 'select-role' NOT NULL,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
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
CREATE TABLE "workspaces" (
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
CREATE TABLE "workflow_versions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"document" jsonb NOT NULL,
	"compiled_agent" jsonb,
	"created_by" text NOT NULL,
	"generated_by_chat_id" text,
	"summary" text,
	"checksum" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflows" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"kind" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"current_version_id" text,
	"created_by" text NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_run_steps" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"run_id" text NOT NULL,
	"node_id" text NOT NULL,
	"node_kind" text NOT NULL,
	"attempt" integer DEFAULT 1 NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"input" jsonb NOT NULL,
	"output" jsonb,
	"error" jsonb,
	"cost" jsonb NOT NULL,
	"logs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workflow_runs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_version_id" text NOT NULL,
	"status" text NOT NULL,
	"trigger_node_id" text NOT NULL,
	"trigger_kind" text NOT NULL,
	"trigger_payload" jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"duration_ms" integer,
	"inngest_run_id" text,
	"cost" jsonb NOT NULL,
	"error" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_directory_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"one_liner" text,
	"description" text,
	"author_name" text,
	"author_url" text,
	"icon_url" text,
	"logo" text,
	"documentation_url" text,
	"support_url" text,
	"privacy_policy_url" text,
	"type" text NOT NULL,
	"source" text,
	"source_feed" text,
	"categories" text[] DEFAULT '{}'::text[] NOT NULL,
	"tool_names" text[] DEFAULT '{}'::text[] NOT NULL,
	"prompt_names" text[] DEFAULT '{}'::text[] NOT NULL,
	"works_with" text[] DEFAULT '{}'::text[] NOT NULL,
	"visibility" text[] DEFAULT '{}'::text[] NOT NULL,
	"remote" jsonb,
	"local" jsonb,
	"permissions" text,
	"has_mcp_app" boolean DEFAULT false NOT NULL,
	"claude_code_copy_text" text,
	"directory_url" text,
	"background_pattern" text,
	"server_label" text,
	"sort_order" integer,
	"rank" integer,
	"popularity_score" integer,
	"trending_score" integer,
	"added_at" date,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connection_requests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"chat_id" text,
	"mcp_server_id" text NOT NULL,
	"app_slug" text NOT NULL,
	"redirect_url" text NOT NULL,
	"resume_event_name" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_connection_id" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"mcp_server_id" text NOT NULL,
	"app_slug" text NOT NULL,
	"display_name" text NOT NULL,
	"status" text NOT NULL,
	"credential_kind" text NOT NULL,
	"external_account_id" text,
	"credential_encrypted" text,
	"scopes" text[] DEFAULT '{}'::text[] NOT NULL,
	"account_email" text,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mcp_servers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text,
	"directory_entry_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"kind" text NOT NULL,
	"transport" text NOT NULL,
	"url" text,
	"auth_config_encrypted" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"tools_last_synced_at" timestamp with time zone,
	"added_by" text,
	"icon" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skill_attachments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"skill_id" text NOT NULL,
	"skill_version_id" text NOT NULL,
	"scope" jsonb NOT NULL,
	"attached_by" text,
	"attached_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skill_versions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"skill_id" text NOT NULL,
	"version_number" integer NOT NULL,
	"instructions" text NOT NULL,
	"required_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"required_credentials" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"input_schema" jsonb,
	"output_schema" jsonb,
	"published_at" timestamp with time zone,
	"published_by" text,
	"changelog" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_skills" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"current_version_id" text NOT NULL,
	"visibility" text DEFAULT 'private' NOT NULL,
	"icon" text,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"owner_id" text,
	"install_count" integer DEFAULT 0 NOT NULL,
	"forked_from_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_run_id_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_events" ADD CONSTRAINT "chat_events_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_default_workspace_id_workspaces_id_fk" FOREIGN KEY ("default_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflows" ADD CONSTRAINT "workflows_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_steps" ADD CONSTRAINT "workflow_run_steps_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_run_steps" ADD CONSTRAINT "workflow_run_steps_run_id_workflow_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."workflow_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_runs" ADD CONSTRAINT "workflow_runs_workflow_version_id_workflow_versions_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "public"."workflow_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_mcp_server_id_mcp_servers_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection_requests" ADD CONSTRAINT "connection_requests_resolved_connection_id_connections_id_fk" FOREIGN KEY ("resolved_connection_id") REFERENCES "public"."connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_mcp_server_id_mcp_servers_id_fk" FOREIGN KEY ("mcp_server_id") REFERENCES "public"."mcp_servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_servers" ADD CONSTRAINT "mcp_servers_directory_entry_id_mcp_directory_entries_id_fk" FOREIGN KEY ("directory_entry_id") REFERENCES "public"."mcp_directory_entries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_attachments" ADD CONSTRAINT "agent_skill_attachments_skill_id_agent_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."agent_skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_attachments" ADD CONSTRAINT "agent_skill_attachments_skill_version_id_agent_skill_versions_id_fk" FOREIGN KEY ("skill_version_id") REFERENCES "public"."agent_skill_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skill_versions" ADD CONSTRAINT "agent_skill_versions_skill_id_agent_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."agent_skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_workspace_ts_idx" ON "audit_log" USING btree ("workspace_id","ts");--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "usage_events_idempotency_idx" ON "usage_events" USING btree ("workspace_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "usage_events_workspace_occurred_idx" ON "usage_events" USING btree ("workspace_id","occurred_at");--> statement-breakpoint
CREATE INDEX "usage_events_chat_idx" ON "usage_events" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "usage_events_run_idx" ON "usage_events" USING btree ("run_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_events_chat_sequence_idx" ON "chat_events" USING btree ("chat_id","sequence");--> statement-breakpoint
CREATE INDEX "chats_user_recent_idx" ON "chats" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "chats_workspace_status_idx" ON "chats" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "chats_workflow_idx" ON "chats" USING btree ("workflow_id");--> statement-breakpoint
CREATE INDEX "chats_waiting_idx" ON "chats" USING btree ("updated_at") WHERE status = 'waiting_for_input';--> statement-breakpoint
CREATE INDEX "messages_chat_created_idx" ON "messages" USING btree ("chat_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_hashed_idx" ON "api_keys" USING btree ("hashed_key");--> statement-breakpoint
CREATE INDEX "api_keys_workspace_idx" ON "api_keys" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_idx" ON "invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "invitations_workspace_status_idx" ON "invitations" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_email_idx" ON "user_profiles" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_members_unique_idx" ON "workspace_members" USING btree ("workspace_id","user_id");--> statement-breakpoint
CREATE INDEX "workspace_members_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_idx" ON "workspaces" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "workspaces_owner_idx" ON "workspaces" USING btree ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_versions_workflow_version_idx" ON "workflow_versions" USING btree ("workflow_id","version_number");--> statement-breakpoint
CREATE INDEX "workflow_versions_chat_idx" ON "workflow_versions" USING btree ("generated_by_chat_id");--> statement-breakpoint
CREATE INDEX "workflows_workspace_status_idx" ON "workflows" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "workflows_workspace_kind_idx" ON "workflows" USING btree ("workspace_id","kind");--> statement-breakpoint
CREATE INDEX "workflows_workspace_created_idx" ON "workflows" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "workflow_run_steps_run_idx" ON "workflow_run_steps" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "workflow_run_steps_run_started_idx" ON "workflow_run_steps" USING btree ("run_id","started_at");--> statement-breakpoint
CREATE INDEX "workflow_runs_workspace_started_idx" ON "workflow_runs" USING btree ("workspace_id","started_at");--> statement-breakpoint
CREATE INDEX "workflow_runs_workflow_status_idx" ON "workflow_runs" USING btree ("workflow_id","status");--> statement-breakpoint
CREATE INDEX "workflow_runs_active_idx" ON "workflow_runs" USING btree ("status","started_at") WHERE status in ('queued', 'running', 'waiting_for_input');--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_directory_entries_slug_idx" ON "mcp_directory_entries" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "mcp_directory_entries_popularity_idx" ON "mcp_directory_entries" USING btree ("popularity_score");--> statement-breakpoint
CREATE INDEX "mcp_directory_entries_trending_idx" ON "mcp_directory_entries" USING btree ("trending_score");--> statement-breakpoint
CREATE INDEX "mcp_directory_entries_type_idx" ON "mcp_directory_entries" USING btree ("type");--> statement-breakpoint
CREATE INDEX "connection_requests_chat_status_idx" ON "connection_requests" USING btree ("chat_id","status");--> statement-breakpoint
CREATE INDEX "connection_requests_expiry_idx" ON "connection_requests" USING btree ("expires_at") WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX "connections_workspace_app_idx" ON "connections" USING btree ("workspace_id","app_slug");--> statement-breakpoint
CREATE INDEX "connections_workspace_server_idx" ON "connections" USING btree ("workspace_id","mcp_server_id");--> statement-breakpoint
CREATE INDEX "connections_status_idx" ON "connections" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mcp_servers_workspace_idx" ON "mcp_servers" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "mcp_servers_slug_idx" ON "mcp_servers" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "mcp_servers_global_slug_idx" ON "mcp_servers" USING btree ("slug") WHERE workspace_id is null;--> statement-breakpoint
CREATE INDEX "agent_skill_attachments_skill_idx" ON "agent_skill_attachments" USING btree ("skill_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skill_versions_skill_version_idx" ON "agent_skill_versions" USING btree ("skill_id","version_number");--> statement-breakpoint
CREATE INDEX "agent_skills_workspace_idx" ON "agent_skills" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skills_global_slug_idx" ON "agent_skills" USING btree ("slug") WHERE workspace_id is null;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_skills_workspace_slug_idx" ON "agent_skills" USING btree ("workspace_id","slug");