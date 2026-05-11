import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "graph.microsoft.com" },
    ],
  },
  async rewrites() {
    return [
      { source: "/api/trpc/:path*", destination: `${apiUrl}/api/trpc/:path*` },
      { source: "/api/chat", destination: `${apiUrl}/api/chat` },
    ];
  },
};

export default nextConfig;
