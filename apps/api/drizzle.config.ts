import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import path from "path";

// Load the environment variables from the appropriate .env file based on NODE_ENV.
// This is necessary because drizzle-kit is run via its own CLI, which doesn't use
// the --env-file flag specified in the package.json scripts.
const envFile = process.env.NODE_ENV
  ? `.env.${process.env.NODE_ENV}`
  : ".env.development";
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default defineConfig({
  schema: "./src/database/schema",
  out: "./src/database/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
