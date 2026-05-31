import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import type {
  CostBreakdown,
  JsonValue,
  RunError,
  RunStatus,
  RunStepLog,
  RunStepStatus,
} from "@mirrorverse/types";
import { tenantPolicy } from "./rls";
import { workspaces } from "./tenancy.schema";
import { workflowVersions, workflows } from "./workflows.schema";

/** One execution of a workflow. The canonical row in run history. */
export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    workflowId: text("workflow_id")
      .notNull()
      .references(() => workflows.id, { onDelete: "cascade" }),
    workflowVersionId: text("workflow_version_id")
      .notNull()
      .references(() => workflowVersions.id, { onDelete: "restrict" }),
    status: text("status").$type<RunStatus>().notNull(),
    triggerNodeId: text("trigger_node_id").notNull(),
    triggerKind: text("trigger_kind").notNull(),
    triggerPayload: jsonb("trigger_payload").$type<JsonValue>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    inngestRunId: text("inngest_run_id"),
    cost: jsonb("cost").$type<CostBreakdown>().notNull(),
    error: jsonb("error").$type<RunError | null>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("workflow_runs_workspace_started_idx").on(t.workspaceId, t.startedAt),
    index("workflow_runs_workflow_status_idx").on(t.workflowId, t.status),
    // Partial index for the dispatcher: which runs are in-flight right now?
    index("workflow_runs_active_idx")
      .on(t.status, t.startedAt)
      .where(sql`status in ('queued', 'running', 'waiting_for_input')`),
    tenantPolicy("workflow_runs"),
  ],
);

/** One node's execution within a run. Powers the run-history debugger. */
export const workflowRunSteps = pgTable(
  "workflow_run_steps",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    runId: text("run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    nodeId: text("node_id").notNull(),
    nodeKind: text("node_kind").notNull(),
    attempt: integer("attempt").notNull().default(1),
    status: text("status").$type<RunStepStatus>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    input: jsonb("input").$type<JsonValue>().notNull(),
    output: jsonb("output").$type<JsonValue | null>(),
    error: jsonb("error").$type<RunError | null>(),
    cost: jsonb("cost").$type<CostBreakdown>().notNull(),
    logs: jsonb("logs")
      .$type<RunStepLog[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("workflow_run_steps_run_idx").on(t.runId),
    index("workflow_run_steps_run_started_idx").on(t.runId, t.startedAt),
    tenantPolicy("workflow_run_steps"),
  ],
);
