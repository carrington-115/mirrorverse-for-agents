import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Testcontainers needs time to pull/boot Postgres on a cold cache.
    testTimeout: 180_000,
    hookTimeout: 180_000,
    // The RLS suite self-skips unless RUN_RLS_IT=1, so a plain `pnpm test`
    // (no Docker) collects zero active tests and must still pass.
    passWithNoTests: true,
  },
});
