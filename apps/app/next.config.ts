import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
};

export default nextConfig;
