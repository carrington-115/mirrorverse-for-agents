import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["**/*.{ts,tsx}"],
      exclude: [
        "**/*.test.{ts,tsx}",
        "**/*.config.{ts,mjs,js}",
        ".next/**",
        "node_modules/**",
        "app/**/layout.tsx",
        "app/**/page.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
        "app/**/not-found.tsx",
      ],
      // Target: 80% across the board. Bootstrapped at 0% so CI doesn't block
      // while the test suite grows. Ratchet these up as new tests land.
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },
  },
  resolve: {
    alias: {
      "@/components/ui": path.resolve(__dirname, "../../packages/ui/src/components/ui"),
      "@/lib/utils": path.resolve(__dirname, "../../packages/ui/src/lib/utils"),
      "@/hooks/use-mobile": path.resolve(__dirname, "../../packages/ui/src/hooks/use-mobile"),
      "@": path.resolve(__dirname, "./"),
    },
  },
});
