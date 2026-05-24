import { nodeConfig } from "@mirrorverse/eslint-config/node";

export default [
  ...nodeConfig,
  {
    rules: {
      // `getRuntimeDb` returns the non-privileged (app_user) connection with no
      // tenant GUC set — querying it directly bypasses tenant isolation (a
      // forgotten workspace filter would then leak across tenants, or with RLS
      // on, silently return zero rows). It must only be reached through
      // `withTenantContext`, which opens a transaction and sets the GUC. For
      // genuine cross-tenant work use `withServiceRole`.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mirrorverse/db",
              importNames: ["getRuntimeDb"],
              message:
                "Don't query getRuntimeDb directly — use withTenantContext(workspaceId, ...) so RLS is scoped, or withServiceRole for cross-tenant access.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["dist/**", "node_modules/**", ".turbo/**"],
  },
];
