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
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.stories.{ts,tsx}",
        "src/**/layout.tsx",
        "src/**/page.tsx",
        "src/**/loading.tsx",
        "src/**/error.tsx",
        "src/**/not-found.tsx",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@/components/ui": path.resolve(__dirname, "../../packages/ui/src/components/ui"),
      "@/lib/utils": path.resolve(__dirname, "../../packages/ui/src/lib/utils"),
      "@/hooks/use-mobile": path.resolve(__dirname, "../../packages/ui/src/hooks/use-mobile"),
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
