CREATE TABLE "phone_numbers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"e164" text NOT NULL,
	"twilio_sid" text NOT NULL,
	"vapi_phone_number_id" text NOT NULL,
	"source" text NOT NULL,
	"connection_id" text,
	"voice_agent_id" text,
	"status" text DEFAULT 'provisioning' NOT NULL,
	"capabilities" jsonb DEFAULT '{"voice":true,"sms":false,"mms":false}'::jsonb NOT NULL,
	"monthly_cost_cents" integer DEFAULT 0 NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_agents" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"workflow_id" text NOT NULL,
	"workflow_version_id" text NOT NULL,
	"provider" text DEFAULT 'vapi' NOT NULL,
	"direction" text NOT NULL,
	"external_assistant_id" text NOT NULL,
	"voice_id" text NOT NULL,
	"model" text NOT NULL,
	"system_prompt" text NOT NULL,
	"first_message" text NOT NULL,
	"end_call_phrases" text[] DEFAULT '{}'::text[] NOT NULL,
	"max_duration_sec" integer DEFAULT 600 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_calls" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"voice_agent_id" text NOT NULL,
	"phone_number_id" text,
	"external_call_id" text NOT NULL,
	"direction" text NOT NULL,
	"from_number" text NOT NULL,
	"to_number" text NOT NULL,
	"status" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_sec" integer,
	"transcript_url" text,
	"recording_url" text,
	"summary" text,
	"cost_cents" integer DEFAULT 0 NOT NULL,
	"ended_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "is_pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "hear_about_us" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "other_role" text;--> statement-breakpoint
ALTER TABLE "workflows" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_voice_agent_id_voice_agents_id_fk" FOREIGN KEY ("voice_agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD CONSTRAINT "voice_agents_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD CONSTRAINT "voice_agents_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "public"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_agents" ADD CONSTRAINT "voice_agents_workflow_version_id_workflow_versions_id_fk" FOREIGN KEY ("workflow_version_id") REFERENCES "public"."workflow_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_voice_agent_id_voice_agents_id_fk" FOREIGN KEY ("voice_agent_id") REFERENCES "public"."voice_agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voice_calls" ADD CONSTRAINT "voice_calls_phone_number_id_phone_numbers_id_fk" FOREIGN KEY ("phone_number_id") REFERENCES "public"."phone_numbers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "phone_numbers_workspace_idx" ON "phone_numbers" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_numbers_e164_workspace_idx" ON "phone_numbers" USING btree ("e164","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_numbers_twilio_sid_idx" ON "phone_numbers" USING btree ("twilio_sid");--> statement-breakpoint
CREATE INDEX "voice_agents_workspace_idx" ON "voice_agents" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_agents_workflow_idx" ON "voice_agents" USING btree ("workflow_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_agents_external_id_idx" ON "voice_agents" USING btree ("external_assistant_id");--> statement-breakpoint
CREATE INDEX "voice_calls_workspace_agent_idx" ON "voice_calls" USING btree ("workspace_id","voice_agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "voice_calls_external_id_idx" ON "voice_calls" USING btree ("external_call_id");