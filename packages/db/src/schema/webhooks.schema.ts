import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { workspaces } from "./tenancy.schema";

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
  (t) => [index("webhooks_workspace_idx").on(t.workspaceId)],
);
