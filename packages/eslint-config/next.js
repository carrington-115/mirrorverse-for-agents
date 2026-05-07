import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { baseConfig } from "./base.js";
import { tailwindConfig } from "./tailwind.js";

/** @type {import("eslint").Linter.Config[]} */
export const nextConfig = [
  ...baseConfig,
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...tailwindConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Single source of truth for unused vars/imports lives in the base config
      // (unused-imports plugin, autofixable). Silence Next's duplicate.
      "@typescript-eslint/no-unused-vars": "off",

      // React Compiler rules — they flag real perf/correctness signals but
      // most existing app code predates them. Off until a dedicated cleanup
      // sweep — re-enable to "warn" or "error" when ready.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/exhaustive-deps": "off",

      // Tech-debt: existing app code uses `any` in chart props, error catches,
      // and form generics. Off here; tighten to "warn" or "error" later.
      "@typescript-eslint/no-explicit-any": "off",

      // Pages-Router-era rule. Both apps use App Router — silence the noise.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default nextConfig;
