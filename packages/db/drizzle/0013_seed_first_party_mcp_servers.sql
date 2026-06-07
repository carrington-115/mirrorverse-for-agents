-- Seed global first-party MCP server rows.
-- workspace_id IS NULL = available to every tenant.
-- transport = 'stdio' is a placeholder; these servers are dispatched in-process.

INSERT INTO mcp_servers (id, workspace_id, slug, name, description, kind, transport, enabled)
VALUES
  (gen_random_uuid()::text, NULL, 'first_party.vault',     'Vault',     'Read and write encrypted workspace secrets.',                       'first_party', 'stdio', true),
  (gen_random_uuid()::text, NULL, 'first_party.workflow',  'Workflow',  'Create, list, get, and archive automation workflows.',              'first_party', 'stdio', true),
  (gen_random_uuid()::text, NULL, 'first_party.schedule',  'Schedule',  'Attach or remove a cron schedule on an automation workflow.',       'first_party', 'stdio', true),
  (gen_random_uuid()::text, NULL, 'first_party.canvas',    'Canvas',    'Incrementally edit a workflow document node-by-node.',              'first_party', 'stdio', true),
  (gen_random_uuid()::text, NULL, 'first_party.knowledge', 'Knowledge', 'Semantic search over workspace knowledge bases via pgvector RAG.', 'first_party', 'stdio', true)
ON CONFLICT DO NOTHING;
