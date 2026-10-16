import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { PlanFeatures, PlanLimits, SubscriptionStatus, UsageKind } from "@mirrorverse/types";

import { chats } from "./chats.schema";
import { tenantPolicy } from "./rls";
import { workflowRuns } from "./runs.schema";
import { workspaces } from "./tenancy.schema";

export const plans = pgTable("plans", {
  id: text("id").primaryKey(), // slug: free | starter | pro | custom
  name: text("name").notNull(),
  stripeProductId: text("stripe_product_id").notNull().default(""),
  stripeMonthlyPriceId: text("stripe_monthly_price_id"),
  stripeAnnualPriceId: text("stripe_annual_price_id"),
  monthlyPriceCents: integer("monthly_price_cents").notNull().default(0),
  annualPriceCents: integer("annual_price_cents").notNull().default(0),
  limits: jsonb("limits").$type<PlanLimits>().notNull(),
  features: jsonb("features").$type<PlanFeatures>().notNull(),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    stripeSubscriptionId: text("stripe_subscription_id").notNull(),
    stripeCustomerId: text("stripe_customer_id").notNull().default(""),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id),
    status: text("status").$type<SubscriptionStatus>().notNull().default("active"),
    currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    defaultPaymentMethod: text("default_payment_method"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("subscriptions_stripe_id_idx").on(t.stripeSubscriptionId),
    index("subscriptions_workspace_idx").on(t.workspaceId),
    tenantPolicy("subscriptions"),
  ],
);

export const usagePeriodAggregates = pgTable(
  "usage_period_aggregates",
  {
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    granularity: text("granularity").$type<"hour" | "day" | "month">().notNull(),
    kind: text("kind").$type<UsageKind>().notNull(),
    totalQuantity: bigint("total_quantity", { mode: "number" }).notNull().default(0),
    totalCostCents: integer("total_cost_cents").notNull().default(0),
    totalCredits: integer("total_credits").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.workspaceId, t.periodStart, t.granularity, t.kind] }),
    index("usage_agg_workspace_period_idx").on(t.workspaceId, t.periodStart),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    stripeInvoiceId: text("stripe_invoice_id").notNull(),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    status: text("status")
      .$type<"draft" | "open" | "paid" | "uncollectible" | "void">()
      .notNull()
      .default("open"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    amountPaidCents: integer("amount_paid_cents").notNull().default(0),
    amountDueCents: integer("amount_due_cents").notNull().default(0),
    hostedInvoiceUrl: text("hosted_invoice_url"),
    invoicePdfUrl: text("invoice_pdf_url"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("invoices_stripe_id_idx").on(t.stripeInvoiceId),
    index("invoices_workspace_idx").on(t.workspaceId),
    tenantPolicy("invoices"),
  ],
);

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
    credits: integer("credits").notNull().default(0),
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

// Global promo codes (e.g. HACKTOBERFEST-26). Not tenant-scoped, like `plans`.
// `valueCents` is the dollar value granted; it is converted to credits at
// redemption time with the same `centsToCredits` rate used for usage.
export const promoCodes = pgTable(
  "promo_codes",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    code: text("code").notNull(), // stored uppercase
    valueCents: integer("value_cents").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    maxRedemptions: integer("max_redemptions"),
    redemptionCount: integer("redemption_count").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    // When true, only emails listed in `promo_code_allowed_emails` may redeem.
    restrictToAllowlist: boolean("restrict_to_allowlist").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("promo_codes_code_idx").on(t.code)],
);

// Emails eligible to redeem an allowlist-restricted promo code (e.g. event
// participants). Stored lowercase. Loaded with
// `packages/db/scripts/import-promo-allowlist.mjs`; never committed to the repo.
export const promoCodeAllowedEmails = pgTable(
  "promo_code_allowed_emails",
  {
    promoCodeId: text("promo_code_id")
      .notNull()
      .references(() => promoCodes.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.promoCodeId, t.email] })],
);

export const promoRedemptions = pgTable(
  "promo_redemptions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()::text`),
    promoCodeId: text("promo_code_id")
      .notNull()
      .references(() => promoCodes.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    redeemedByUserId: text("redeemed_by_user_id").notNull(),
    credits: integer("credits").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One redemption of a given code per workspace.
    uniqueIndex("promo_redemptions_code_workspace_idx").on(t.promoCodeId, t.workspaceId),
    index("promo_redemptions_workspace_idx").on(t.workspaceId),
    tenantPolicy("promo_redemptions"),
  ],
);

// Per-workspace pool of one-off bonus credits (from promo redemptions). Bonus
// credits are spent only by usage beyond the plan's hard cap. Consumption is
// settled lazily: when the credit period rolls over, the tracked period's
// overage is moved into `consumedCredits`.
export const workspaceBonusCredits = pgTable(
  "workspace_bonus_credits",
  {
    workspaceId: text("workspace_id")
      .primaryKey()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    grantedCredits: integer("granted_credits").notNull().default(0),
    consumedCredits: integer("consumed_credits").notNull().default(0),
    trackedPeriodStart: timestamp("tracked_period_start", { withTimezone: true }).notNull(),
    trackedPeriodEnd: timestamp("tracked_period_end", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  () => [tenantPolicy("workspace_bonus_credits")],
);
