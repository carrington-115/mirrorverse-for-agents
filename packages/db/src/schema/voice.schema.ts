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
import type {
  PhoneNumberStatus,
  VoiceAgentNode,
  VoiceCallDirection,
  VoiceCallStatus,
} from "@mirrorverse/types";
import { tenantPolicy } from "./rls.js";
import { connections } from "./tools.schema.js";
import { workspaces } from "./tenancy.schema.js";
import { workflows, workflowVersions } from "./workflows.schema.js";

/**
 * Stores encrypted Twilio credentials for BYO (bring-your-own) phone numbers
 * connected via the Mirrorpilot chat flow. Separate from the Composio
 * connections table, which requires an MCP server reference.
 */
export const voiceTwilioCreds = pgTable(
  "voice_twilio_creds",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    credentialEncrypted: text("credential_encrypted").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("voice_twilio_creds_workspace_idx").on(t.workspaceId),
    tenantPolicy("voice_twilio_creds"),
  ],
);

export const voiceAgents = pgTable(
  "voice_agents",
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
      .references(() => workflowVersions.id),
    provider: text("provider").$type<"vapi">().notNull().default("vapi"),
    direction: text("direction").$type<"inbound" | "outbound">().notNull(),
    externalAssistantId: text("external_assistant_id").notNull(),
    voiceId: text("voice_id").notNull(),
    model: text("model").notNull(),
    systemPrompt: text("system_prompt").notNull(),
    firstMessage: text("first_message").notNull(),
    endCallPhrases: text("end_call_phrases")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    maxDurationSec: integer("max_duration_sec").notNull().default(600),
    enabled: boolean("enabled").notNull().default(true),
    voiceConfig: jsonb("voice_config").$type<VoiceAgentNode | null>().default(null),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("voice_agents_workspace_idx").on(t.workspaceId),
    uniqueIndex("voice_agents_workflow_idx").on(t.workflowId),
    uniqueIndex("voice_agents_external_id_idx").on(t.externalAssistantId),
    tenantPolicy("voice_agents"),
  ],
);

export const phoneNumbers = pgTable(
  "phone_numbers",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    e164: text("e164").notNull(),
    twilioSid: text("twilio_sid").notNull(),
    vapiPhoneNumberId: text("vapi_phone_number_id").notNull(),
    source: text("source").$type<"managed" | "byo">().notNull(),
    connectionId: text("connection_id").references(() => connections.id, { onDelete: "set null" }),
    byoTwilioCredId: text("byo_twilio_cred_id").references(() => voiceTwilioCreds.id, {
      onDelete: "set null",
    }),
    voiceAgentId: text("voice_agent_id").references(() => voiceAgents.id, { onDelete: "set null" }),
    status: text("status").$type<PhoneNumberStatus>().notNull().default("provisioning"),
    capabilities: jsonb("capabilities")
      .$type<{ voice: boolean; sms: boolean; mms: boolean }>()
      .notNull()
      .default(sql`'{"voice":true,"sms":false,"mms":false}'::jsonb`),
    monthlyCostCents: integer("monthly_cost_cents").notNull().default(0),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("phone_numbers_workspace_idx").on(t.workspaceId),
    uniqueIndex("phone_numbers_e164_workspace_idx").on(t.e164, t.workspaceId),
    uniqueIndex("phone_numbers_twilio_sid_idx").on(t.twilioSid),
    tenantPolicy("phone_numbers"),
  ],
);

export const voiceCalls = pgTable(
  "voice_calls",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    voiceAgentId: text("voice_agent_id")
      .notNull()
      .references(() => voiceAgents.id, { onDelete: "cascade" }),
    phoneNumberId: text("phone_number_id").references(() => phoneNumbers.id, {
      onDelete: "set null",
    }),
    externalCallId: text("external_call_id").notNull(),
    direction: text("direction").$type<VoiceCallDirection>().notNull(),
    fromNumber: text("from_number").notNull(),
    toNumber: text("to_number").notNull(),
    status: text("status").$type<VoiceCallStatus>().notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSec: integer("duration_sec"),
    transcriptUrl: text("transcript_url"),
    recordingUrl: text("recording_url"),
    summary: text("summary"),
    costCents: integer("cost_cents").notNull().default(0),
    endedReason: text("ended_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("voice_calls_workspace_agent_idx").on(t.workspaceId, t.voiceAgentId),
    uniqueIndex("voice_calls_external_id_idx").on(t.externalCallId),
    tenantPolicy("voice_calls"),
  ],
);
