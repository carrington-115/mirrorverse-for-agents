import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Trace files from the monorepo root so workspace deps get bundled into
  // the serverless functions and Vercel detects the Next.js output.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
