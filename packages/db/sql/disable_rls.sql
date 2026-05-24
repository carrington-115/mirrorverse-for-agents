-- Reverses sql/rls_policies.sql: drops every Row-Level Security policy and
-- DISABLES RLS on every public table that has it enabled.
--
-- Why both: dropping policies alone leaves RLS *enabled* with zero policies,
-- which fails closed — the non-privileged `app_user` runtime connection would
-- then see ZERO rows on every workspace-scoped table (the "No chats yet" bug).
-- Disabling RLS lets `app_user` read/write subject only to table GRANTs, so
-- tenant isolation falls back to the application layer (every query already
-- filters by workspace_id).
--
-- Idempotent — safe to re-run. Apply on a PRIVILEGED connection (DATABASE_URL):
--   pnpm --filter @mirrorverse/db exec node scripts/disable-rls.mjs
-- Restore RLS later by re-applying sql/rls_policies.sql.

begin;

do $$
declare
  r record;
begin
  -- 1. Drop every policy in the public schema (all were added by the RLS branch).
  for r in
    select tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;

  -- 2. Disable RLS on every public table that currently has it enabled.
  for r in
    select c.relname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  loop
    execute format('alter table public.%I disable row level security', r.relname);
  end loop;
end
$$;

commit;
