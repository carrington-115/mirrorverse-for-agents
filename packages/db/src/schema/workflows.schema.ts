import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  DeployedAgent,
  WorkflowDocument,
  WorkflowKind,
  WorkflowStatus,
} from "@mirrorverse/types";
import { workspaces } from "./tenancy.schema";

/**
 * Workflow root entity. Stable identity across versions; the canvas/document
 * lives on `workflow_versions`. `current_version_id` points at the version
 * that's currently active or being edited.
 */
export const workflows = pgTable(
  "workflows",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    kind: text("kind").$type<WorkflowKind>().notNull(),
    status: text("status").$type<WorkflowStatus>().notNull().default("draft"),
    currentVersionId: text("current_version_id"),
    createdBy: text("created_by").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("workflows_workspace_status_idx").on(t.workspaceId, t.status),
    index("workflows_workspace_kind_idx").on(t.workspaceId, t.kind),
    index("workflows_workspace_created_idx").on(t.workspaceId, t.createdAt),
  ],
);

/**
 * Immutable workflow snapshot. Every save creates a new row.
 * `document` is the canvas; `compiled_agent` is the flat artifact derived
 * from the canvas for chat/voice agent kinds (handed to Anthropic / Vapi).
 */
export const workflowVersions = pgTable(
  "workflow_versions",
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
    versionNumber: integer("version_number").notNull(),
    document: jsonb("document").$type<WorkflowDocument>().notNull(),
    compiledAgent: jsonb("compiled_agent").$type<DeployedAgent | null>(),
    createdBy: text("created_by").notNull(),
    generatedByChatId: text("generated_by_chat_id"),
    summary: text("summary"),
    checksum: text("checksum").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("workflow_versions_workflow_version_idx").on(t.workflowId, t.versionNumber),
    index("workflow_versions_chat_idx").on(t.generatedByChatId),
  ],
);
