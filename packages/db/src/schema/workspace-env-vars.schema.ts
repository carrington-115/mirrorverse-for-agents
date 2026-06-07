import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { tenantPolicy } from "./rls";
import { workspaces } from "./tenancy.schema";

export const workspaceEnvVars = pgTable(
  "workspace_env_vars",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Value stored plaintext — scoped to workspace via workspaceId filter.
    // Encrypt at rest before exposing to multi-tenant infrastructure.
    value: text("value").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("workspace_env_vars_name_idx").on(t.workspaceId, t.name),
    index("workspace_env_vars_workspace_idx").on(t.workspaceId),
    tenantPolicy("workspace_env_vars"),
  ],
);
