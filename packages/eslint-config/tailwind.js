import betterTailwind from "eslint-plugin-better-tailwindcss";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to the repo's actual globals.css regardless of which cwd ESLint runs from.
// __dirname here is packages/eslint-config; ui's globals.css is two levels up.
const ENTRY_POINT = resolve(__dirname, "../ui/src/styles/globals.css");

/** @type {import("eslint").Linter.Config[]} */
export const tailwindConfig = [
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    plugins: { "better-tailwindcss": betterTailwind },
    settings: {
      "better-tailwindcss": {
        entryPoint: ENTRY_POINT,
        callees: ["cn", "cva", "cx", "clsx", "twMerge"],
        attributes: ["class", "className"],
      },
    },
    rules: {
      "better-tailwindcss/no-conflicting-classes": "error",
      "better-tailwindcss/no-duplicate-classes": "error",
      "better-tailwindcss/no-deprecated-classes": "error",
      "better-tailwindcss/no-unnecessary-whitespace": "error",

      "better-tailwindcss/enforce-canonical-classes": "off",
      "better-tailwindcss/enforce-shorthand-classes": "off",
      "better-tailwindcss/enforce-consistent-variable-syntax": "off",
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-important-position": "off",
      "better-tailwindcss/enforce-consistent-variant-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
      "better-tailwindcss/enforce-logical-properties": "off",

      "better-tailwindcss/no-restricted-classes": "off",
      "better-tailwindcss/no-unknown-classes": "off",
    },
  },
];

export default tailwindConfig;
