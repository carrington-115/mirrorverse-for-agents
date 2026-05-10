import { nextConfig } from "@mirrorverse/eslint-config/next";

export default [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", ".turbo/**", "next-env.d.ts"],
  },
];
