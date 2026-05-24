// Read-only inspection of RLS state. Loads DATABASE_URL from backend env.
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as dotenv from "dotenv";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../apps/backend/.env.development") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  const version = await sql`select version()`;
  console.log("CONNECTED:", version[0].version.split(",")[0]);

  const policies = await sql`
    select tablename, policyname from pg_policies
    where schemaname = 'public' order by tablename, policyname`;
  console.log(`\nEXISTING POLICIES (public): ${policies.length}`);
  for (const p of policies) console.log(`  ${p.tablename}.${p.policyname}`);

  const rls = await sql`
    select c.relname as table, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as rls_forced
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
    order by c.relname`;
  console.log(`\nTABLES WITH RLS ENABLED: ${rls.length}`);
  for (const r of rls) console.log(`  ${r.table}${r.rls_forced ? " (forced)" : ""}`);

  const tables = await sql`
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' order by c.relname`;
  console.log(`\nALL PUBLIC TABLES: ${tables.length}`);
  console.log("  " + tables.map((t) => t.relname).join(", "));

  const role =
    await sql`select rolname, rolbypassrls, rolcanlogin from pg_roles where rolname = 'app_user'`;
  console.log(`\napp_user ROLE: ${role.length ? JSON.stringify(role[0]) : "DOES NOT EXIST"}`);

  // drizzle migrations table (default schema "drizzle")
  try {
    const migs =
      await sql`select id, hash, created_at from drizzle.__drizzle_migrations order by created_at`;
    console.log(`\nAPPLIED DRIZZLE MIGRATIONS: ${migs.length}`);
    for (const m of migs) console.log(`  id=${m.id} created_at=${m.created_at}`);
  } catch (e) {
    console.log(`\nDRIZZLE MIGRATIONS TABLE: not found (${e.message})`);
  }
} finally {
  await sql.end();
}
