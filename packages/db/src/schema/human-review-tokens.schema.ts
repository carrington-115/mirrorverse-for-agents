import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";

export const humanReviewTokens = pgTable(
  "human_review_tokens",
  {
    token: text("token")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    runId: text("run_id").notNull(),
    nodeId: text("node_id").notNull(),
    workspaceId: text("workspace_id").notNull(),
    promptText: text("prompt_text"),
    usedAt: timestamp("used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("hr_tokens_run_node_uidx").on(t.runId, t.nodeId)],
);
