import { nextConfig } from "@mirrorverse/eslint-config/next";
import { nodeConfig } from "@mirrorverse/eslint-config/node";
import { baseConfig } from "@mirrorverse/eslint-config/base";
import { tailwindConfig } from "@mirrorverse/eslint-config/tailwind";

/**
 * Root ESLint flat config used when ESLint runs from the repo root
 * (lint-staged, pnpm exec eslint, IDE lint on the workspace as a whole).
 *
 * Each per-workspace eslint.config.mjs still works when ESLint runs from
 * inside that workspace. This file scopes the same shared configs to the
 * right paths so a single root invocation lints the whole repo correctly.
 */

const APPS_NEXT = ["apps/app/**/*.{ts,tsx,js,jsx}", "apps/marketing/**/*.{ts,tsx,js,jsx}"];
const APPS_NODE = [
  "apps/backend/**/*.{ts,tsx,js,jsx}",
  "packages/env/**/*.{ts,tsx,js,jsx}",
  "packages/db/**/*.{ts,tsx,js,jsx}",
];
const PKG_UI = ["packages/ui/**/*.{ts,tsx,js,jsx}"];
const PKG_ESLINT = ["packages/eslint-config/**/*.js"];

/** Apply `files` scope to each config object, preserving any existing `files` matcher. */
function scope(configs, fileGlobs) {
  return configs.map((c) => {
    if (c.ignores && !c.files && !c.rules && !c.plugins && !c.languageOptions) {
      // Pure-ignore blocks should remain global, not workspace-scoped.
      return c;
    }
    return { ...c, files: fileGlobs };
  });
}

export default [
  // Next.js apps
  ...scope(nextConfig, APPS_NEXT),

  // Node-side packages (api, env)
  ...scope(nodeConfig, APPS_NODE),

  // UI package — base + tailwind, with shadcn-friendly overrides
  ...scope(baseConfig, PKG_UI),
  ...scope(tailwindConfig, PKG_UI),
  {
    files: ["packages/ui/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },

  // The eslint-config package itself (plain JS)
  ...scope(baseConfig, PKG_ESLINT),

  // Global ignores
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/.turbo/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/next-env.d.ts",
      "**/*.config.{js,mjs,cjs,ts}",
      "**/*.tsbuildinfo",
      "scripts/**",
    ],
  },
];
