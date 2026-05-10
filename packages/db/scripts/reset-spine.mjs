// One-shot dev utility: drop all spine tables and the drizzle migration
// schema so a regenerated 0000 can apply cleanly. Never run against prod.
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

if (!process.env.MIRRORVERSE_ALLOW_DESTRUCTIVE) {
  console.error("Refusing to run without MIRRORVERSE_ALLOW_DESTRUCTIVE=1.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const tables = [
  // Legacy tables from before the rewrite — drop so drizzle-kit doesn't
  // prompt "did you rename users → user_profiles?".
  "tasks",
  "organization_members",
  "organizations",
  "users",
  "agent_skill_attachments",
  "agent_skill_versions",
  "agent_skills",
  "chat_events",
  "messages",
  "chats",
  "agent_events",
  "agent_messages",
  "agent_sessions",
  "workflow_run_steps",
  "workflow_runs",
  "workflow_versions",
  "workflows",
  "connection_requests",
  "connections",
  "mcp_servers",
  "api_keys",
  "invitations",
  "workspace_members",
  "user_profiles",
  "workspaces",
];

for (const t of tables) {
  await sql.unsafe(`drop table if exists "${t}" cascade`);
  console.log(" - dropped", t);
}
// Legacy Postgres enum types from the old schema
for (const t of ["org_member_status", "org_role"]) {
  await sql.unsafe(`drop type if exists "${t}" cascade`);
  console.log(" - dropped type", t);
}

await sql`drop schema if exists drizzle cascade`;
console.log(" - dropped drizzle schema");
await sql.end();
