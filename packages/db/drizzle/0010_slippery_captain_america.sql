CREATE TABLE "human_review_tokens" (
	"token" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"run_id" text NOT NULL,
	"node_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"prompt_text" text,
	"used_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hr_tokens_run_node_uidx" UNIQUE("run_id","node_id")
);
