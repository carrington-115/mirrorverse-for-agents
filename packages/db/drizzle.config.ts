import path from "path";
import { fileURLToPath } from "url";

import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit doesn't honor --env-file, so load the backend app's env file
// (the canonical location for DATABASE_URL) from a path relative to this config.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : ".env.development";
dotenv.config({ path: path.resolve(__dirname, "../../apps/backend", envFile) });

export default defineConfig({
  schema: "./src/schema",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
