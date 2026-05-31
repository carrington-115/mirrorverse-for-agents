import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Trace files from the monorepo root so workspace deps get bundled into
  // the serverless functions and Vercel detects the Next.js output.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env"],
};

export default nextConfig;
