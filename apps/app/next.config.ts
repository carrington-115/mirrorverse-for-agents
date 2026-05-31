import type { NextConfig } from "next";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // Trace files from the monorepo root so workspace deps get bundled into
  // the serverless functions and Vercel detects the Next.js output.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env", "@mirrorverse/agent"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
      { protocol: "https", hostname: "api.iconify.design" },
      { protocol: "https", hostname: "**.composio.dev" },
      { protocol: "https", hostname: "**.composio.network" },
      { protocol: "https", hostname: "cdn.jsdelivr.net" },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/trpc/:path*", destination: `${apiUrl}/api/trpc/:path*` },
      { source: "/api/chat", destination: `${apiUrl}/api/chat` },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
