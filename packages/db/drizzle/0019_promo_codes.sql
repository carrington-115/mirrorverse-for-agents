CREATE TABLE "promo_codes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"code" text NOT NULL,
	"value_cents" integer NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"max_redemptions" integer,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promo_redemptions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid()::text NOT NULL,
	"promo_code_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"redeemed_by_user_id" text NOT NULL,
	"credits" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promo_redemptions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_bonus_credits" (
	"workspace_id" text PRIMARY KEY NOT NULL,
	"granted_credits" integer DEFAULT 0 NOT NULL,
	"consumed_credits" integer DEFAULT 0 NOT NULL,
	"tracked_period_start" timestamp with time zone NOT NULL,
	"tracked_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workspace_bonus_credits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promo_redemptions" ADD CONSTRAINT "promo_redemptions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_bonus_credits" ADD CONSTRAINT "workspace_bonus_credits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "promo_codes_code_idx" ON "promo_codes" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "promo_redemptions_code_workspace_idx" ON "promo_redemptions" USING btree ("promo_code_id","workspace_id");--> statement-breakpoint
CREATE INDEX "promo_redemptions_workspace_idx" ON "promo_redemptions" USING btree ("workspace_id");--> statement-breakpoint
CREATE POLICY "promo_redemptions_tenant_isolation" ON "promo_redemptions" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));--> statement-breakpoint
CREATE POLICY "workspace_bonus_credits_tenant_isolation" ON "workspace_bonus_credits" AS PERMISSIVE FOR ALL TO public USING (workspace_id = current_setting('app.current_workspace', true)) WITH CHECK (workspace_id = current_setting('app.current_workspace', true));