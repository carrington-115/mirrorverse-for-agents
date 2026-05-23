-- Provisions the non-privileged `app_user` role that Row-Level Security
-- policies are enforced against (issue #31). RLS only bites for roles that
-- lack the BYPASSRLS attribute, so the runtime must connect as this role
-- rather than the privileged service/`postgres` role used for migrations.
--
-- Apply once per environment, using a PRIVILEGED connection (DATABASE_URL):
--   pnpm --filter @mirrorverse/db exec node scripts/apply-sql.mjs sql/app_user.sql
-- or paste into the Supabase SQL editor. Idempotent — safe to re-run.
--
-- The role is created NOLOGIN with no password. Enable login out of band so
-- the secret never lands in version control, then point RUNTIME_DATABASE_URL
-- at it:
--   ALTER ROLE app_user WITH LOGIN PASSWORD '<generated>';
-- (Supabase: Database > Roles, or the SQL editor.)

-- 1. Role: explicitly NOBYPASSRLS / NOSUPERUSER so policies always apply.
do $$
begin
  if not exists (select from pg_roles where rolname = 'app_user') then
    create role app_user nologin noinherit nobypassrls nosuperuser;
  end if;
end
$$;

-- 2. Schema + privileges. These only decide which tables the role may attempt
--    to touch; RLS still gates which rows it actually sees.
grant usage on schema public to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;
grant usage, select on all sequences in schema public to app_user;

-- 3. Future tables/sequences (added by later migrations) inherit the grants.
alter default privileges in schema public
  grant select, insert, update, delete on tables to app_user;
alter default privileges in schema public
  grant usage, select on sequences to app_user;
