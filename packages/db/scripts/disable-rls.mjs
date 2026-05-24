// Applies sql/disable_rls.sql to DATABASE_URL: drops all public-schema RLS
// policies and disables RLS on every public table that has it enabled.
// Reverses scripts/apply-sql.mjs sql/rls_policies.sql. Read-mostly aside from
// the DDL it runs; idempotent. Loads the privileged DATABASE_URL from backend env.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import * as dotenv from "dotenv";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../apps/backend/.env.development") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set (apps/backend/.env.development)");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const before = await sql`
    select
      (select count(*)::int from pg_policies where schemaname = 'public') as policies,
      (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity) as rls_tables`;
  console.log(
    `before: ${before[0].policies} policies, ${before[0].rls_tables} tables with RLS enabled`,
  );

  const source = readFileSync(path.resolve(__dirname, "../sql/disable_rls.sql"), "utf8");
  await sql.unsafe(source);

  const after = await sql`
    select
      (select count(*)::int from pg_policies where schemaname = 'public') as policies,
      (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
         where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity) as rls_tables`;
  console.log(
    `after:  ${after[0].policies} policies, ${after[0].rls_tables} tables with RLS enabled`,
  );
  console.log("RLS disabled. Restore with: scripts/apply-sql.mjs sql/rls_policies.sql");
} finally {
  await sql.end();
}
