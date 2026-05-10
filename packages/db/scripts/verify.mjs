// Quick read-only sanity check after a migration. Lists every table in the
// public schema with foreign-key and index counts. Run from the db package:
//
//   DATABASE_URL=... pnpm --filter @mirrorverse/db db:verify
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const tables = await sql`
  select tablename from pg_tables
  where schemaname = 'public'
    and tablename not like 'pg_%'
    and tablename not like '_drizzle%'
  order by tablename
`;

console.log(`${tables.length} tables in public schema:`);
for (const t of tables) console.log(" -", t.tablename);

const fkCount = await sql`
  select count(*)::int as n from pg_constraint
  where contype = 'f' and connamespace = 'public'::regnamespace
`;
const idxCount = await sql`
  select count(*)::int as n from pg_indexes where schemaname = 'public'
`;

console.log(`\nForeign keys: ${fkCount[0].n}`);
console.log(`Indexes:      ${idxCount[0].n}`);

await sql.end();
