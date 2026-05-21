CREATE TABLE "voice_twilio_creds" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"credential_encrypted" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"url" text NOT NULL,
	"auth_type" text DEFAULT 'none' NOT NULL,
	"credentials" jsonb,
	"custom_headers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"timeout_seconds" integer DEFAULT 30 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD COLUMN "byo_twilio_cred_id" text;--> statement-breakpoint
ALTER TABLE "voice_twilio_creds" ADD CONSTRAINT "voice_twilio_creds_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "voice_twilio_creds_workspace_idx" ON "voice_twilio_creds" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "webhooks_workspace_idx" ON "webhooks" USING btree ("workspace_id");--> statement-breakpoint
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_byo_twilio_cred_id_voice_twilio_creds_id_fk" FOREIGN KEY ("byo_twilio_cred_id") REFERENCES "public"."voice_twilio_creds"("id") ON DELETE set null ON UPDATE no action;