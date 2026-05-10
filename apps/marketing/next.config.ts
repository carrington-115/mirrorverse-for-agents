import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mirrorverse/ui", "@mirrorverse/env"],
};

export default nextConfig;
