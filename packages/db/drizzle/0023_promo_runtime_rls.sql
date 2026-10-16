ALTER TABLE "promo_code_allowed_emails" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promo_codes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "promo_code_allowed_emails_runtime_select" ON "promo_code_allowed_emails" AS PERMISSIVE FOR SELECT TO "app_user" USING (true);--> statement-breakpoint
CREATE POLICY "promo_codes_runtime_select" ON "promo_codes" AS PERMISSIVE FOR SELECT TO "app_user" USING (true);--> statement-breakpoint
CREATE POLICY "promo_codes_runtime_update" ON "promo_codes" AS PERMISSIVE FOR UPDATE TO "app_user" USING (true) WITH CHECK (true);