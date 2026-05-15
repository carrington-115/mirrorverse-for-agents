import path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
import postgres from "postgres";
import { readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../apps/backend/.env.development") });

const url = process.env.DATABASE_URL;
console.log("Connecting to:", url?.replace(/:([^:@]+)@/, ":***@"));

const sql = postgres(url, { max: 1, onnotice: () => {} });

try {
  // Check what migrations have been applied
  const applied = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at ASC`;
  console.log(
    "Applied migrations:",
    applied.map((r) => r.hash),
  );
} catch (err) {
  console.log("No migrations table yet or error:", err.message);
}

// Try applying 0002
const migrationSql = readFileSync(
  path.resolve(__dirname, "../drizzle/0002_onboarding_and_workspace_meta.sql"),
  "utf8",
);
console.log("\nApplying 0002_onboarding_and_workspace_meta.sql...");
try {
  for (const statement of migrationSql.split("--> statement-breakpoint")) {
    const trimmed = statement.trim();
    if (trimmed) {
      console.log("Running:", trimmed.slice(0, 80) + "...");
      await sql.unsafe(trimmed);
    }
  }
  console.log("Success!");
} catch (err) {
  console.error("Error:", err.message);
}

await sql.end();
