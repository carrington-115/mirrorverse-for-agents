import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { JsonValue } from "@mirrorverse/types";
import { tenantPolicy } from "./rls.js";
import { workspaces } from "./tenancy.schema.js";
import { workflows } from "./workflows.schema.js";

export type WebhookAuthType = "none" | "bearer" | "basic" | "custom_header";

export interface WebhookBearerCredentials {
  readonly apiKey: string;
}

export interface WebhookBasicCredentials {
  readonly username: string;
  readonly password: string;
}

export interface WebhookCustomHeaderCredentials {
  readonly headerName: string;
  readonly headerValue: string;
}

export type WebhookCredentials =
  | WebhookBearerCredentials
  | WebhookBasicCredentials
  | WebhookCustomHeaderCredentials
  | null;

export interface WebhookCustomHeader {
  readonly name: string;
  readonly value: string;
}

export const webhooks = pgTable(
  "webhooks",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    authType: text("auth_type").$type<WebhookAuthType>().notNull().default("none"),
    credentials: jsonb("credentials").$type<WebhookCredentials>(),
    customHeaders: jsonb("custom_headers")
      .$type<WebhookCustomHeader[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    timeoutSeconds: integer("timeout_seconds").notNull().default(30),
    maxRetries: integer("max_retries").notNull().default(3),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("webhooks_workspace_idx").on(t.workspaceId), tenantPolicy("webhooks")],
);

/**
 * One inbound webhook endpoint per trigger.webhook node in an active workflow.
 * Created/reactivated when the workflow is activated; disabled on pause/archive.
 */
export const webhookEndpoints = pgTable(
  "webhook_endpoints",
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
    triggerNodeId: text("trigger_node_id").notNull(),
    slug: text("slug").notNull(),
    secret: text("secret").notNull(),
    verifySignature: boolean("verify_signature").notNull().default(false),
    enabled: boolean("enabled").notNull().default(true),
    lastCalledAt: timestamp("last_called_at", { withTimezone: true }),
    callsLast24h: integer("calls_last_24h").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("webhook_endpoints_slug_idx").on(t.slug),
    uniqueIndex("webhook_endpoints_workflow_node_idx").on(t.workflowId, t.triggerNodeId),
    index("webhook_endpoints_workspace_idx").on(t.workspaceId),
    tenantPolicy("webhook_endpoints"),
  ],
);

/**
 * One row per received inbound request. Serves as both a debug log and an
 * idempotency store — the unique index on (endpoint_id, request_id) prevents
 * the same x-request-id from being dispatched twice.
 */
export const webhookInboundLog = pgTable(
  "webhook_inbound_log",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    endpointId: text("endpoint_id")
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    requestId: text("request_id"),
    method: text("method").notNull(),
    headers: jsonb("headers").$type<Record<string, string>>().notNull(),
    body: jsonb("body").$type<JsonValue>().notNull(),
    status: text("status").$type<"dispatched" | "duplicate" | "rejected">().notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("webhook_inbound_log_dedup_idx").on(t.endpointId, t.requestId),
    index("webhook_inbound_log_endpoint_idx").on(t.endpointId),
    index("webhook_inbound_log_received_idx").on(t.receivedAt),
  ],
);
