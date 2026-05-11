// Apply a SQL file to DATABASE_URL. TTY-less alternative to `drizzle-kit
// push` when the latter wants interactive confirmation.
import postgres from "postgres";
import { readFileSync } from "node:fs";

const path = process.argv[2];
if (!path || !process.env.DATABASE_URL) {
  console.error("usage: DATABASE_URL=... node apply-sql.mjs <file.sql>");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const source = readFileSync(path, "utf8");

await sql.unsafe(source);
console.log("applied:", path);

await sql.end();
