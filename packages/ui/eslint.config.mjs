import { baseConfig } from "@mirrorverse/eslint-config/base";
import { tailwindConfig } from "@mirrorverse/eslint-config/tailwind";

export default [
  ...baseConfig,
  ...tailwindConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    ignores: ["node_modules/**", ".turbo/**"],
  },
];
