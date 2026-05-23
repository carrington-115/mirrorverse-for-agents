import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type { JsonObject, SkillAttachmentScope, SkillVisibility } from "@mirrorverse/types";
import { activeWorkspaceSql, tenantOrGlobalPolicy, transitivePolicy } from "./rls";
import { workspaces } from "./tenancy.schema";

/**
 * Reusable bundle of agent behavior. The product ships a starter library
 * (workspace_id IS NULL = global / built-in) so the orchestrator gets a
 * pre-vetted boost on common tasks instead of reasoning from scratch.
 * Users can fork or author their own.
 */
export const agentSkills = pgTable(
  "agent_skills",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id").references(() => workspaces.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    currentVersionId: text("current_version_id").notNull(),
    visibility: text("visibility").$type<SkillVisibility>().notNull().default("private"),
    icon: text("icon"),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    ownerId: text("owner_id"),
    installCount: integer("install_count").notNull().default(0),
    forkedFromId: text("forked_from_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("agent_skills_workspace_idx").on(t.workspaceId),
    // Built-in skills (workspace_id IS NULL) must have unique slugs.
    uniqueIndex("agent_skills_global_slug_idx")
      .on(t.slug)
      .where(sql`workspace_id is null`),
    // Per-workspace skills get unique slugs scoped to the workspace.
    uniqueIndex("agent_skills_workspace_slug_idx").on(t.workspaceId, t.slug),
    // Global (workspace_id IS NULL) starter skills readable by every tenant.
    tenantOrGlobalPolicy("agent_skills"),
  ],
);

export const agentSkillVersions = pgTable(
  "agent_skill_versions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    skillId: text("skill_id")
      .notNull()
      .references(() => agentSkills.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    instructions: text("instructions").notNull(),
    requiredTools: jsonb("required_tools")
      .$type<{ mcpServerId: string; toolName: string }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    requiredCredentials: jsonb("required_credentials")
      .$type<{ appSlug: string }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    inputSchema: jsonb("input_schema").$type<JsonObject | null>(),
    outputSchema: jsonb("output_schema").$type<JsonObject | null>(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: text("published_by"),
    changelog: text("changelog"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("agent_skill_versions_skill_version_idx").on(t.skillId, t.versionNumber),
    // Scoped through the parent skill. Versions of a global skill are readable
    // by every tenant, but a tenant connection cannot author versions under a
    // global parent (writes require a matching, non-null workspace).
    transitivePolicy(
      "agent_skill_versions",
      sql`exists (select 1 from agent_skills where agent_skills.id = agent_skill_versions.skill_id and (agent_skills.workspace_id = ${activeWorkspaceSql} or agent_skills.workspace_id is null))`,
      sql`exists (select 1 from agent_skills where agent_skills.id = agent_skill_versions.skill_id and agent_skills.workspace_id = ${activeWorkspaceSql})`,
    ),
  ],
);

/**
 * Attaches a specific skill version to a scope (chat, workflow, or workspace).
 * The orchestrator merges instructions + required tools from every attachment
 * relevant to the current chat into the next agent call.
 */
export const agentSkillAttachments = pgTable(
  "agent_skill_attachments",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    skillId: text("skill_id")
      .notNull()
      .references(() => agentSkills.id, { onDelete: "cascade" }),
    skillVersionId: text("skill_version_id")
      .notNull()
      .references(() => agentSkillVersions.id, { onDelete: "cascade" }),
    scope: jsonb("scope").$type<SkillAttachmentScope>().notNull(),
    attachedBy: text("attached_by"),
    attachedAt: timestamp("attached_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("agent_skill_attachments_skill_idx").on(t.skillId),
    // Scoped through the parent skill (read allows global skills; writes
    // require a matching, non-null workspace).
    transitivePolicy(
      "agent_skill_attachments",
      sql`exists (select 1 from agent_skills where agent_skills.id = agent_skill_attachments.skill_id and (agent_skills.workspace_id = ${activeWorkspaceSql} or agent_skills.workspace_id is null))`,
      sql`exists (select 1 from agent_skills where agent_skills.id = agent_skill_attachments.skill_id and agent_skills.workspace_id = ${activeWorkspaceSql})`,
    ),
  ],
);
