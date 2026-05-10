import { nodeConfig } from "@mirrorverse/eslint-config/node";

export default [
  ...nodeConfig,
  {
    ignores: ["node_modules/**", ".turbo/**", "drizzle/**"],
  },
];
