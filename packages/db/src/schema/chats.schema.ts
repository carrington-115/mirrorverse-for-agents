import { sql } from "drizzle-orm";
import { bigint, index, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  ChatEventKind,
  ChatEventPayload,
  ChatPurpose,
  ChatStatus,
  ContentBlock,
  CostBreakdown,
  MessageRole,
  StopReason,
  Usage,
} from "@mirrorverse/types";
import { workspaces } from "./tenancy.schema";
import { workflows } from "./workflows.schema";

/**
 * One conversation between the user and the orchestrator agent. Lives durably
 * so it can pause for hours waiting on credentials or human review. When the
 * chat produces or edits a workflow, `workflow_id` links it back.
 */
export const chats = pgTable(
  "chats",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    purpose: text("purpose").$type<ChatPurpose>().notNull(),
    status: text("status").$type<ChatStatus>().notNull().default("active"),
    title: text("title"),
    workflowId: text("workflow_id").references(() => workflows.id, { onDelete: "set null" }),
    inngestRunId: text("inngest_run_id"),
    model: text("model").notNull(),
    attachedSkillIds: text("attached_skill_ids")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    cost: jsonb("cost").$type<CostBreakdown>().notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("chats_user_recent_idx").on(t.userId, t.lastMessageAt),
    index("chats_workspace_status_idx").on(t.workspaceId, t.status),
    index("chats_workflow_idx").on(t.workflowId),
    // Partial index for the resume worker: which chats are paused?
    index("chats_waiting_idx")
      .on(t.updatedAt)
      .where(sql`status = 'waiting_for_input'`),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    role: text("role").$type<MessageRole>().notNull(),
    contentBlocks: jsonb("content_blocks").$type<ContentBlock[]>().notNull(),
    cost: jsonb("cost").$type<CostBreakdown>().notNull(),
    usage: jsonb("usage").$type<Usage | null>(),
    model: text("model"),
    stopReason: text("stop_reason").$type<StopReason | null>(),
    parentMessageId: text("parent_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("messages_chat_created_idx").on(t.chatId, t.createdAt)],
);

/**
 * State-change stream that drives the chat UI. `sequence` is monotonic per
 * chat so the client can replay from a specific point on reconnect.
 * Append-only — never updated after insert.
 */
export const chatEvents = pgTable(
  "chat_events",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    kind: text("kind").$type<ChatEventKind>().notNull(),
    payload: jsonb("payload").$type<ChatEventPayload>().notNull(),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("chat_events_chat_sequence_idx").on(t.chatId, t.sequence)],
);
