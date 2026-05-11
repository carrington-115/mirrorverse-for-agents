-- Onboarding state on user profiles
ALTER TABLE "user_profiles"
  ADD COLUMN "onboarding_step" text NOT NULL DEFAULT 'select-role',
  ADD COLUMN "onboarding_completed_at" timestamptz;

-- Company metadata + onboarding selections on workspaces
ALTER TABLE "workspaces"
  ADD COLUMN "website" text,
  ADD COLUMN "company_size" text,
  ADD COLUMN "industry" text,
  ADD COLUMN "default_apps" text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN "default_deploy_channels" text[] NOT NULL DEFAULT '{}'::text[];
