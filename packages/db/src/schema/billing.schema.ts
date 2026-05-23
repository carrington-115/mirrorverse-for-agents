import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { UsageKind } from "@mirrorverse/types";

import { chats } from "./chats.schema";
import { tenantPolicy } from "./rls";
import { workflowRuns } from "./runs.schema";
import { workspaces } from "./tenancy.schema";

export const usageEvents = pgTable(
  "usage_events",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    kind: text("kind").$type<UsageKind>().notNull(),
    quantity: bigint("quantity", { mode: "number" }).notNull(),
    unit: text("unit").notNull(),
    model: text("model"),
    costCents: integer("cost_cents").notNull().default(0),
    billable: boolean("billable").notNull().default(true),
    runId: text("run_id").references(() => workflowRuns.id, { onDelete: "set null" }),
    chatId: text("chat_id").references(() => chats.id, { onDelete: "set null" }),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    idempotencyKey: text("idempotency_key").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("usage_events_idempotency_idx").on(t.workspaceId, t.idempotencyKey),
    index("usage_events_workspace_occurred_idx").on(t.workspaceId, t.occurredAt),
    index("usage_events_chat_idx").on(t.chatId),
    index("usage_events_run_idx").on(t.runId),
    tenantPolicy("usage_events"),
  ],
);
