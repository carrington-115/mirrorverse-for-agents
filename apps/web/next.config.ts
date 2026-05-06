import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
};

export default nextConfig;
