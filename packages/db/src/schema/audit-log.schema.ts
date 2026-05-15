import { randomUUID } from "node:crypto";

import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { workspaces } from "./tenancy.schema";

export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    workspaceId: text("workspace_id").references(() => workspaces.id, {
      onDelete: "cascade",
    }),
    userId: text("user_id").notNull(),
    action: text("action").notNull(),
    targetKind: text("target_kind"),
    targetId: text("target_id"),
    payload: jsonb("payload"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("audit_log_workspace_ts_idx").on(t.workspaceId, t.ts),
    index("audit_log_user_idx").on(t.userId),
  ],
);
