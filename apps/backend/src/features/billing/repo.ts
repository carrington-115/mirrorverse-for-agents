import {
  and,
  asc,
  desc,
  eq,
  gte,
  lte,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";
import { centsToCredits } from "@mirrorverse/agent";
import type { AgentUsageEntry, StepUsageBreakdown } from "@mirrorverse/agent";
import type { UsageKind } from "@mirrorverse/types";

import { env } from "@mirrorverse/env/backend";

import { cacheDel, cacheKeys, cached } from "../../lib/cache";
import { addCreditsUsed, sumCredits } from "./credit-counter";
import { addPeriod } from "./enforcement";
import { stripe } from "./stripe-client";

const {
  usageEvents,
  subscriptions,
  plans,
  invoices,
  usagePeriodAggregates,
  workflowRuns,
  workflows,
  chats,
  connections,
  phoneNumbers,
  voiceAgents,
  workspaces,
  knowledgeBases,
} = schema;

// ─── Chat usage (existing) ────────────────────────────────────────────────────

export async function getChatTotalCostCents(
  db: Database,
  chatId: string,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
    })
    .from(usageEvents)
    .where(eq(usageEvents.chatId, chatId));
  return row?.total ?? 0;
}

export interface RecordChatUsageInput {
  readonly db: Database;
  readonly workspaceId: string;
  readonly chatId: string;
  readonly idempotencyKey: string;
  readonly model: string;
  readonly breakdown: StepUsageBreakdown;
}

function rowsFromBreakdown(input: RecordChatUsageInput): InsertRow[] {
  return input.breakdown.entries.map((entry, index) => ({
    workspaceId: input.workspaceId,
    chatId: input.chatId,
    kind: entry.kind,
    quantity: entry.quantity,
    unit: entry.unit,
    model: entry.model,
    costCents: entry.costCents,
    credits: entry.credits,
    idempotencyKey: `${input.idempotencyKey}:${entry.kind}:${index}`,
  }));
}

type InsertRow = {
  workspaceId: string;
  chatId: string;
  kind: AgentUsageEntry["kind"];
  quantity: number;
  unit: string;
  model: string;
  costCents: number;
  credits: number;
  idempotencyKey: string;
};

export async function recordChatUsage(
  input: RecordChatUsageInput,
): Promise<void> {
  const rows = rowsFromBreakdown(input);
  if (rows.length === 0) return;
  const inserted = await input.db
    .insert(usageEvents)
    .values(rows)
    .onConflictDoNothing()
    .returning({ credits: usageEvents.credits });
  await addCreditsUsed(input.db, input.workspaceId, sumCredits(inserted));
}

// ─── Sandbox usage (code node) ───────────────────────────────────────────────

export async function recordSandboxUsage(
  db: Database,
  input: {
    workspaceId: string;
    runId: string;
    nodeId: string;
    sandboxSeconds: number;
    costCents: number;
  },
): Promise<void> {
  const inserted = await db
    .insert(usageEvents)
    .values({
      workspaceId: input.workspaceId,
      runId: input.runId,
      kind: "sandbox_second",
      quantity: input.sandboxSeconds,
      unit: "second",
      model: null,
      costCents: input.costCents,
      credits: centsToCredits(input.costCents),
      billable: true,
      idempotencyKey: `${input.runId}:${input.nodeId}:sandbox`,
    })
    .onConflictDoNothing()
    .returning({ credits: usageEvents.credits });
  await addCreditsUsed(db, input.workspaceId, sumCredits(inserted));
}

// ─── Plan & subscription ──────────────────────────────────────────────────────

// Plan/subscription is read on nearly every request (chat, workflow, voice and
// knowledge routers). Short TTL bounds staleness; writers below invalidate.
const ACTIVE_SUBSCRIPTION_TTL_SECONDS = 60;

// Stripe identifiers and the payment-method id never go to Redis. Code that
// needs them (the billing settings page) reads Postgres directly through
// getActiveSubscriptionUncached.
export async function getActiveSubscription(db: Database, workspaceId: string) {
  return cached(
    cacheKeys.activeSubscription(workspaceId),
    ACTIVE_SUBSCRIPTION_TTL_SECONDS,
    async () => {
      const row = await getActiveSubscriptionUncached(db, workspaceId);
      if (!row) return null;
      const {
        stripeSubscriptionId: _stripeSubscriptionId,
        stripeCustomerId: _stripeCustomerId,
        defaultPaymentMethod: _defaultPaymentMethod,
        ...subscription
      } = row.subscription;
      return { plan: row.plan, subscription };
    },
  );
}

export async function getActiveSubscriptionUncached(
  db: Database,
  workspaceId: string,
) {
  const [row] = await db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.workspaceId, workspaceId),
        eq(subscriptions.status, "active"),
      ),
    )
    .limit(1);
  return row ?? null;
}

// Active subscriptions whose period has elapsed and need to be rolled
// forward by the subscription-renewal cron.
export async function getExpiredActiveSubscriptions(db: Database, now: Date) {
  return db
    .select({
      subscription: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
        lte(subscriptions.currentPeriodEnd, now),
      ),
    );
}

export async function renewSubscriptionPeriod(
  db: Database,
  subscriptionId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<void> {
  const [row] = await db
    .update(subscriptions)
    .set({
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning({ workspaceId: subscriptions.workspaceId });
  if (row) await cacheDel(cacheKeys.activeSubscription(row.workspaceId));
}

export interface UpsertSubscriptionInput {
  readonly workspaceId: string;
  readonly stripeSubscriptionId: string;
  readonly stripeCustomerId: string;
  readonly planId: string;
  readonly status: string;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEndsAt: Date | null;
  readonly defaultPaymentMethod: string | null;
}

export async function upsertSubscription(
  db: Database,
  input: UpsertSubscriptionInput,
): Promise<void> {
  await db
    .insert(subscriptions)
    .values({
      workspaceId: input.workspaceId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      planId: input.planId,
      status: input.status as "active",
      currentPeriodStart: input.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd,
      cancelAtPeriodEnd: input.cancelAtPeriodEnd,
      trialEndsAt: input.trialEndsAt,
      defaultPaymentMethod: input.defaultPaymentMethod,
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeSubscriptionId,
      set: {
        planId: input.planId,
        status: input.status as "active",
        currentPeriodStart: input.currentPeriodStart,
        currentPeriodEnd: input.currentPeriodEnd,
        cancelAtPeriodEnd: input.cancelAtPeriodEnd,
        trialEndsAt: input.trialEndsAt,
        defaultPaymentMethod: input.defaultPaymentMethod,
        updatedAt: new Date(),
      },
    });
  await cacheDel(cacheKeys.activeSubscription(input.workspaceId));
}

export async function getFreePlan(db: Database) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, "free"))
    .limit(1);
  return plan ?? null;
}

// ─── Invoices ─────────────────────────────────────────────────────────────────

export interface UpsertInvoiceInput {
  readonly workspaceId: string;
  readonly stripeInvoiceId: string;
  readonly subscriptionId: string | null;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly status: "draft" | "open" | "paid" | "uncollectible" | "void";
  readonly subtotalCents: number;
  readonly taxCents: number;
  readonly totalCents: number;
  readonly amountPaidCents: number;
  readonly amountDueCents: number;
  readonly hostedInvoiceUrl: string | null;
  readonly invoicePdfUrl: string | null;
  readonly paidAt: Date | null;
}

export async function upsertInvoice(
  db: Database,
  input: UpsertInvoiceInput,
): Promise<void> {
  await db
    .insert(invoices)
    .values(input)
    .onConflictDoUpdate({
      target: invoices.stripeInvoiceId,
      set: {
        status: input.status,
        subtotalCents: input.subtotalCents,
        taxCents: input.taxCents,
        totalCents: input.totalCents,
        amountPaidCents: input.amountPaidCents,
        amountDueCents: input.amountDueCents,
        hostedInvoiceUrl: input.hostedInvoiceUrl,
        invoicePdfUrl: input.invoicePdfUrl,
        paidAt: input.paidAt,
        updatedAt: new Date(),
      },
    });
}

export async function listInvoices(
  db: Database,
  workspaceId: string,
  limit = 20,
) {
  return db
    .select()
    .from(invoices)
    .where(eq(invoices.workspaceId, workspaceId))
    .orderBy(desc(invoices.createdAt))
    .limit(limit);
}

// ─── Usage this period ────────────────────────────────────────────────────────

export interface UsageSummaryEntry {
  kind: UsageKind;
  totalQuantity: number;
  totalCostCents: number;
  totalCredits: number;
}

export async function getUsageThisPeriod(
  db: Database,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<UsageSummaryEntry[]> {
  const rows = await db
    .select({
      kind: usageEvents.kind,
      totalQuantity: sql<number>`coalesce(sum(${usageEvents.quantity}), 0)::bigint`,
      totalCostCents: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
      totalCredits: sql<number>`coalesce(sum(${usageEvents.credits}), 0)::int`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.workspaceId, workspaceId),
        gte(usageEvents.occurredAt, periodStart),
        lte(usageEvents.occurredAt, periodEnd),
      ),
    )
    .groupBy(usageEvents.kind);
  return rows as UsageSummaryEntry[];
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

export async function upsertUsagePeriodAggregates(
  db: Database,
  rows: {
    workspaceId: string;
    periodStart: Date;
    periodEnd: Date;
    granularity: "hour" | "day" | "month";
    kind: UsageKind;
    totalQuantity: number;
    totalCostCents: number;
    totalCredits: number;
  }[],
): Promise<void> {
  if (rows.length === 0) return;
  await db
    .insert(usagePeriodAggregates)
    .values(rows)
    .onConflictDoUpdate({
      target: [
        usagePeriodAggregates.workspaceId,
        usagePeriodAggregates.periodStart,
        usagePeriodAggregates.granularity,
        usagePeriodAggregates.kind,
      ],
      set: {
        totalQuantity: sql`excluded.total_quantity`,
        totalCostCents: sql`excluded.total_cost_cents`,
        totalCredits: sql`excluded.total_credits`,
      },
    });
}

export async function getHourlyUsageSince(
  db: Database,
  since: Date,
  until: Date,
) {
  return db
    .select({
      workspaceId: usageEvents.workspaceId,
      kind: usageEvents.kind,
      totalQuantity: sql<number>`coalesce(sum(${usageEvents.quantity}), 0)::bigint`,
      totalCostCents: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
      totalCredits: sql<number>`coalesce(sum(${usageEvents.credits}), 0)::int`,
    })
    .from(usageEvents)
    .where(
      and(
        gte(usageEvents.occurredAt, since),
        lte(usageEvents.occurredAt, until),
      ),
    )
    .groupBy(usageEvents.workspaceId, usageEvents.kind);
}

export async function getDailyUsageSince(
  db: Database,
  since: Date,
  until: Date,
) {
  return db
    .select({
      workspaceId: usageEvents.workspaceId,
      kind: usageEvents.kind,
      totalQuantity: sql<number>`coalesce(sum(${usageEvents.quantity}), 0)::bigint`,
      totalCostCents: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
      totalCredits: sql<number>`coalesce(sum(${usageEvents.credits}), 0)::int`,
    })
    .from(usageEvents)
    .where(
      and(
        gte(usageEvents.occurredAt, since),
        lte(usageEvents.occurredAt, until),
      ),
    )
    .groupBy(usageEvents.workspaceId, usageEvents.kind);
}

export interface DailyUsageEntry {
  periodStart: Date;
  kind: UsageKind;
  totalQuantity: number;
  totalCostCents: number;
  totalCredits: number;
}

export async function getDailyUsageAggregates(
  db: Database,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<DailyUsageEntry[]> {
  const rows = await db
    .select({
      periodStart: usagePeriodAggregates.periodStart,
      kind: usagePeriodAggregates.kind,
      totalQuantity: usagePeriodAggregates.totalQuantity,
      totalCostCents: usagePeriodAggregates.totalCostCents,
      totalCredits: usagePeriodAggregates.totalCredits,
    })
    .from(usagePeriodAggregates)
    .where(
      and(
        eq(usagePeriodAggregates.workspaceId, workspaceId),
        eq(usagePeriodAggregates.granularity, "day"),
        gte(usagePeriodAggregates.periodStart, periodStart),
        lte(usagePeriodAggregates.periodStart, periodEnd),
      ),
    )
    .orderBy(asc(usagePeriodAggregates.periodStart));
  return rows as DailyUsageEntry[];
}

export async function getPaidSubscriptions(db: Database) {
  return db
    .select({
      workspaceId: subscriptions.workspaceId,
      stripeCustomerId: subscriptions.stripeCustomerId,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.status, "active"),
        sql`${plans.monthlyPriceCents} > 0`,
      ),
    );
}

// ─── Lazy free-subscription bootstrap ────────────────────────────────────────
// Called by billing procedures when a workspace has no active subscription
// (e.g. workspaces created before billing was set up, or when Stripe was
// unavailable at workspace-creation time). Idempotent via upsertSubscription.
export async function ensureWorkspaceFreeSubscription(
  db: Database,
  workspaceId: string,
): Promise<void> {
  const existing = await getActiveSubscription(db, workspaceId);
  if (existing) return;

  const freePlan = await getFreePlan(db);
  if (!freePlan) return;

  const now = new Date();
  const periodEnd = addPeriod(freePlan.limits.creditsPeriod, now);

  await upsertSubscription(db, {
    workspaceId,
    stripeSubscriptionId: `manual-free-${workspaceId}`,
    stripeCustomerId: `dev-local-${workspaceId}`,
    planId: "free",
    status: "active",
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    trialEndsAt: null,
    defaultPaymentMethod: null,
  });
}

// ─── Lazy Stripe customer bootstrap ──────────────────────────────────────────
// Called by billing procedures (and the workspace-creation bootstrap) when a
// workspace doesn't have a Stripe customer yet — e.g. workspaces created
// before billing was wired up, or when the fire-and-forget creation-time
// bootstrap failed. Idempotent: returns the existing id if already set.
export async function ensureWorkspaceStripeCustomer(
  db: Database,
  workspaceId: string,
): Promise<string> {
  const [ws] = await db
    .select({
      stripeCustomerId: workspaces.stripeCustomerId,
      billingEmail: workspaces.billingEmail,
    })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (ws?.stripeCustomerId) return ws.stripeCustomerId;

  let stripeCustomerId: string;
  if (env.STRIPE_SECRET_KEY) {
    const customer = await stripe.customers.create({
      ...(ws?.billingEmail ? { email: ws.billingEmail } : {}),
      metadata: { workspaceId },
    });
    stripeCustomerId = customer.id;
  } else {
    stripeCustomerId = `dev-local-${workspaceId}`;
  }

  await db
    .update(workspaces)
    .set({ stripeCustomerId })
    .where(eq(workspaces.id, workspaceId));

  return stripeCustomerId;
}

// ─── Capacity counts ──────────────────────────────────────────────────────────

export async function countRunsToday(
  db: Database,
  workspaceId: string,
): Promise<number> {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.workspaceId, workspaceId),
        gte(workflowRuns.startedAt, todayUtc),
      ),
    );
  return row?.count ?? 0;
}

export async function countRunsThisPeriod(
  db: Database,
  workspaceId: string,
  periodStart: Date,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workflowRuns)
    .where(
      and(
        eq(workflowRuns.workspaceId, workspaceId),
        gte(workflowRuns.startedAt, periodStart),
      ),
    );
  return row?.count ?? 0;
}

export async function countGenerationsThisPeriod(
  db: Database,
  workspaceId: string,
  periodStart: Date,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chats)
    .where(
      and(
        eq(chats.workspaceId, workspaceId),
        eq(chats.purpose, "generate_workflow"),
        gte(chats.createdAt, periodStart),
      ),
    );
  return row?.count ?? 0;
}

export async function countConnectionsInWorkspace(
  db: Database,
  workspaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(connections)
    .where(
      and(
        eq(connections.workspaceId, workspaceId),
        eq(connections.status, "active"),
      ),
    );
  return row?.count ?? 0;
}

export async function countPhoneNumbers(
  db: Database,
  workspaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(phoneNumbers)
    .where(
      and(
        eq(phoneNumbers.workspaceId, workspaceId),
        eq(phoneNumbers.status, "active"),
      ),
    );
  return row?.count ?? 0;
}

export async function countVoiceAgents(
  db: Database,
  workspaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(voiceAgents)
    .where(
      and(
        eq(voiceAgents.workspaceId, workspaceId),
        eq(voiceAgents.enabled, true),
      ),
    );
  return row?.count ?? 0;
}

export async function countWorkflows(
  db: Database,
  workspaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(workflows)
    .where(eq(workflows.workspaceId, workspaceId));
  return row?.count ?? 0;
}

export async function countKnowledgeBases(
  db: Database,
  workspaceId: string,
): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.workspaceId, workspaceId));
  return row?.count ?? 0;
}

export interface DailyCreditEntry {
  day: string; // ISO date string "YYYY-MM-DD"
  totalCostCents: number;
  totalCredits: number;
}

export async function getDailyCreditUsage(
  db: Database,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<DailyCreditEntry[]> {
  const rows = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${usageEvents.occurredAt} AT TIME ZONE 'UTC'), 'YYYY-MM-DD')`,
      totalCostCents: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
      totalCredits: sql<number>`coalesce(sum(${usageEvents.credits}), 0)::int`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.workspaceId, workspaceId),
        gte(usageEvents.occurredAt, periodStart),
        lte(usageEvents.occurredAt, periodEnd),
      ),
    )
    .groupBy(
      sql`date_trunc('day', ${usageEvents.occurredAt} AT TIME ZONE 'UTC')`,
    )
    .orderBy(
      sql`date_trunc('day', ${usageEvents.occurredAt} AT TIME ZONE 'UTC')`,
    );
  return rows;
}

export async function getTotalCostCentsByPeriod(
  db: Database,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${usageEvents.costCents}), 0)::int`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.workspaceId, workspaceId),
        gte(usageEvents.occurredAt, periodStart),
        lte(usageEvents.occurredAt, periodEnd),
      ),
    );
  return row?.total ?? 0;
}

export async function getTotalCreditsByPeriod(
  db: Database,
  workspaceId: string,
  periodStart: Date,
  periodEnd: Date,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`coalesce(sum(${usageEvents.credits}), 0)::int`,
    })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.workspaceId, workspaceId),
        gte(usageEvents.occurredAt, periodStart),
        lte(usageEvents.occurredAt, periodEnd),
      ),
    );
  return row?.total ?? 0;
}
