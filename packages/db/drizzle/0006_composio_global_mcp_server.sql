-- 0006: Seed global mcp_servers row for Composio.
--
-- The connection_requests table requires a non-null mcpServerId FK. When the
-- agent's Composio dispatcher needs to record an auth interrupt, it looks up
-- the global Composio server row (workspaceId IS NULL, slug = 'composio').
-- This migration ensures that row exists once and is idempotent.

INSERT INTO "mcp_servers" ("slug", "name", "description", "kind", "transport", "enabled")
VALUES (
  'composio',
  'Composio',
  'Composio-managed integrations — OAuth and tool execution via composio.dev',
  'composio',
  'http',
  true
)
ON CONFLICT DO NOTHING;
