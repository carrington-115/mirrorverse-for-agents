import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import type {
  ApiKeyScope,
  CompanySize,
  OnboardingStep,
  WorkspaceRole,
  WorkspaceStatus,
} from "@mirrorverse/types";

import { tenantPolicy } from "./rls";

/**
 * Top-level tenant. Every other domain table carries `workspace_id` and
 * cascades on delete from here. Stripe customer and billing email live at
 * this level since billing is per-workspace.
 */
export const workspaces = pgTable(
  "workspaces",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    status: text("status").$type<WorkspaceStatus>().notNull().default("active"),
    planId: text("plan_id").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    billingEmail: text("billing_email"),
    ownerId: text("owner_id").notNull(),
    website: text("website"),
    companySize: text("company_size").$type<CompanySize>(),
    industry: text("industry"),
    defaultApps: text("default_apps")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    defaultDeployChannels: text("default_deploy_channels")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("workspaces_slug_idx").on(t.slug),
    index("workspaces_owner_idx").on(t.ownerId),
  ],
);

/**
 * App-level mirror of the Supabase auth user. Stores display data we don't
 * want to fetch from Supabase on every request.
 */
export const userProfiles = pgTable(
  "user_profiles",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name"),
    avatarUrl: text("avatar_url"),
    defaultWorkspaceId: text("default_workspace_id").references(() => workspaces.id, {
      onDelete: "set null",
    }),
    onboardingStep: text("onboarding_step")
      .$type<OnboardingStep>()
      .notNull()
      .default("select-role"),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
    hearAboutUs: text("hear_about_us"),
    role: text("role"),
    otherRole: text("other_role"),
    emailOptOut: boolean("email_opt_out").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("user_profiles_email_idx").on(t.email)],
);

export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role").$type<WorkspaceRole>().notNull(),
    invitedBy: text("invited_by"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("workspace_members_unique_idx").on(t.workspaceId, t.userId),
    index("workspace_members_user_idx").on(t.userId),
    tenantPolicy("workspace_members"),
  ],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    hashedKey: text("hashed_key").notNull(),
    prefix: text("prefix").notNull(),
    scopes: text("scopes").array().$type<ApiKeyScope[]>().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdBy: text("created_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("api_keys_hashed_idx").on(t.hashedKey),
    index("api_keys_workspace_idx").on(t.workspaceId),
    tenantPolicy("api_keys"),
  ],
);

export const invitations = pgTable(
  "invitations",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").$type<WorkspaceRole>().notNull(),
    token: text("token").notNull(),
    status: text("status").notNull().default("pending"),
    invitedBy: text("invited_by").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("invitations_token_idx").on(t.token),
    index("invitations_workspace_status_idx").on(t.workspaceId, t.status),
    tenantPolicy("invitations"),
  ],
);
