CREATE TABLE "promo_code_allowed_emails" (
	"promo_code_id" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "promo_code_allowed_emails_promo_code_id_email_pk" PRIMARY KEY("promo_code_id","email")
);
--> statement-breakpoint
ALTER TABLE "promo_codes" ADD COLUMN "restrict_to_allowlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "promo_code_allowed_emails" ADD CONSTRAINT "promo_code_allowed_emails_promo_code_id_promo_codes_id_fk" FOREIGN KEY ("promo_code_id") REFERENCES "public"."promo_codes"("id") ON DELETE cascade ON UPDATE no action;