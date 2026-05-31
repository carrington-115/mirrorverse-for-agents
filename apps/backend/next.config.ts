import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Tell Next to trace files from the monorepo root so workspace deps
  // (@mirrorverse/db, @mirrorverse/agent, etc.) get bundled into serverless functions.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: [
    "@mirrorverse/agent",
    "@mirrorverse/db",
    "@mirrorverse/env",
    "@mirrorverse/types",
  ],
  // Node-only libs (native bindings / fs reads / dynamic require) that must be
  // loaded at runtime from node_modules instead of bundled by the compiler.
  serverExternalPackages: [
    "pdf-parse",
    "mammoth",
    "xlsx",
    "cheerio",
    "@anthropic-ai/claude-agent-sdk",
    "@composio/core",
    "stripe",
    "twilio",
  ],
};

export default nextConfig;
