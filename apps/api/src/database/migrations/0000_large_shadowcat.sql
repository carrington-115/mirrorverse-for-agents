CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"website" varchar(255) NOT NULL,
	"industry" varchar(255) NOT NULL,
	"company_size" varchar(255) NOT NULL,
	"creator_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
