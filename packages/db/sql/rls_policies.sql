-- Row-Level Security policies for tenant isolation (issue #31).
--
-- The DB had RLS ENABLED on every table but ZERO policies, which fails closed:
-- the non-privileged `app_user` role (RUNTIME_DATABASE_URL) could read/write
-- nothing. This file creates every policy the schema declares (26 tables) so
-- the runtime connection works while staying tenant-scoped, and DISABLES RLS on
-- the three tables that are enforced at the application layer only.
--
-- Mirrors the declarative factories in src/schema/rls.ts. Keep the two in sync.
-- Apply once per environment on a PRIVILEGED connection (DATABASE_URL):
--   pnpm --filter @mirrorverse/db exec node scripts/apply-sql.mjs sql/rls_policies.sql
-- or paste into the Supabase SQL editor. Idempotent — safe to re-run.
--
-- Policies target PUBLIC, so every role WITHOUT the BYPASSRLS attribute (i.e.
-- `app_user`) is constrained; the privileged migration/service role bypasses
-- them. `current_setting('app.current_workspace', true)` uses missing_ok = true:
-- an unset GUC yields NULL, every predicate is false, zero rows (fail closed).

begin;

-- ---------------------------------------------------------------------------
-- tenantPolicy: tables with a NOT NULL workspace_id.
--   workspace_id = <active workspace GUC>
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  tenant_tables text[] := array[
    'usage_events', 'audit_log',
    'knowledge_bases', 'knowledge_documents',
    'workflow_runs', 'workflow_run_steps',
    'chats',
    'workspace_members', 'api_keys', 'invitations',
    'connections', 'connection_requests',
    'webhooks',
    'voice_twilio_creds', 'voice_agents', 'phone_numbers', 'voice_calls',
    'workflows', 'workflow_versions'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_tenant_isolation', t);
    execute format(
      'create policy %I on %I as permissive for all to public '
      || 'using (workspace_id = current_setting(''app.current_workspace'', true)) '
      || 'with check (workspace_id = current_setting(''app.current_workspace'', true))',
      t || '_tenant_isolation', t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- tenantOrGlobalPolicy: nullable workspace_id, NULL = global/built-in row.
--   read: workspace_id = <guc> OR workspace_id IS NULL
--   write: workspace_id = <guc>   (a tenant cannot create/mutate a global row)
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  global_tables text[] := array['agent_skills', 'mcp_servers'];
begin
  foreach t in array global_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_tenant_isolation', t);
    execute format(
      'create policy %I on %I as permissive for all to public '
      || 'using (workspace_id = current_setting(''app.current_workspace'', true) '
      || 'or workspace_id is null) '
      || 'with check (workspace_id = current_setting(''app.current_workspace'', true))',
      t || '_tenant_isolation', t
    );
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- transitivePolicy: no workspace_id of its own — scoped through a parent row.
-- ---------------------------------------------------------------------------

-- knowledge_chunks → knowledge_bases
alter table knowledge_chunks enable row level security;
drop policy if exists knowledge_chunks_tenant_isolation on knowledge_chunks;
create policy knowledge_chunks_tenant_isolation on knowledge_chunks
  as permissive for all to public
  using (exists (select 1 from knowledge_bases
    where knowledge_bases.id = knowledge_chunks.kb_id
      and knowledge_bases.workspace_id = current_setting('app.current_workspace', true)))
  with check (exists (select 1 from knowledge_bases
    where knowledge_bases.id = knowledge_chunks.kb_id
      and knowledge_bases.workspace_id = current_setting('app.current_workspace', true)));

-- messages → chats
alter table messages enable row level security;
drop policy if exists messages_tenant_isolation on messages;
create policy messages_tenant_isolation on messages
  as permissive for all to public
  using (exists (select 1 from chats
    where chats.id = messages.chat_id
      and chats.workspace_id = current_setting('app.current_workspace', true)))
  with check (exists (select 1 from chats
    where chats.id = messages.chat_id
      and chats.workspace_id = current_setting('app.current_workspace', true)));

-- chat_events → chats
alter table chat_events enable row level security;
drop policy if exists chat_events_tenant_isolation on chat_events;
create policy chat_events_tenant_isolation on chat_events
  as permissive for all to public
  using (exists (select 1 from chats
    where chats.id = chat_events.chat_id
      and chats.workspace_id = current_setting('app.current_workspace', true)))
  with check (exists (select 1 from chats
    where chats.id = chat_events.chat_id
      and chats.workspace_id = current_setting('app.current_workspace', true)));

-- agent_skill_versions → agent_skills (global parent readable; writes require a match)
alter table agent_skill_versions enable row level security;
drop policy if exists agent_skill_versions_tenant_isolation on agent_skill_versions;
create policy agent_skill_versions_tenant_isolation on agent_skill_versions
  as permissive for all to public
  using (exists (select 1 from agent_skills
    where agent_skills.id = agent_skill_versions.skill_id
      and (agent_skills.workspace_id = current_setting('app.current_workspace', true)
        or agent_skills.workspace_id is null)))
  with check (exists (select 1 from agent_skills
    where agent_skills.id = agent_skill_versions.skill_id
      and agent_skills.workspace_id = current_setting('app.current_workspace', true)));

-- agent_skill_attachments → agent_skills (global parent readable; writes require a match)
alter table agent_skill_attachments enable row level security;
drop policy if exists agent_skill_attachments_tenant_isolation on agent_skill_attachments;
create policy agent_skill_attachments_tenant_isolation on agent_skill_attachments
  as permissive for all to public
  using (exists (select 1 from agent_skills
    where agent_skills.id = agent_skill_attachments.skill_id
      and (agent_skills.workspace_id = current_setting('app.current_workspace', true)
        or agent_skills.workspace_id is null)))
  with check (exists (select 1 from agent_skills
    where agent_skills.id = agent_skill_attachments.skill_id
      and agent_skills.workspace_id = current_setting('app.current_workspace', true)));

-- ---------------------------------------------------------------------------
-- appManagedPolicy: tables that are NOT tenant-isolated at the DB layer but
-- still have RLS enabled. Tenant isolation for these is enforced in the
-- application (they are read pre-tenant by the bootstrap, written by app_user
-- during onboarding, or are a global public catalog). A permissive USING(true)
-- /WITH CHECK(true) keeps RLS enabled without gating access.
--   - workspaces / user_profiles: read by withTenantContext (auth.me) and
--     user_profiles is written by app_user (completeOnboarding) — needs ALL.
--   - mcp_directory_entries: global MCP catalog (read on the privileged conn).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
  app_managed_tables text[] := array['workspaces', 'user_profiles', 'mcp_directory_entries'];
begin
  foreach t in array app_managed_tables loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists %I on %I', t || '_app_managed', t);
    execute format(
      'create policy %I on %I as permissive for all to public '
      || 'using (true) with check (true)',
      t || '_app_managed', t
    );
  end loop;
end
$$;

commit;
