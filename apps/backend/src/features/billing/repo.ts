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
import type { AgentUsageEntry, StepUsageBreakdown } from "@mirrorverse/agent";
import type { UsageKind } from "@mirrorverse/types";

const {
  usageEvents,
  subscriptions,
  plans,
  invoices,
  usagePeriodAggregates,
  workflowRuns,
  chats,
  connections,
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
  idempotencyKey: string;
};

export async function recordChatUsage(
  input: RecordChatUsageInput,
): Promise<void> {
  const rows = rowsFromBreakdown(input);
  if (rows.length === 0) return;
  await input.db.insert(usageEvents).values(rows).onConflictDoNothing();
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
  await db
    .insert(usageEvents)
    .values({
      workspaceId: input.workspaceId,
      runId: input.runId,
      kind: "sandbox_second",
      quantity: input.sandboxSeconds,
      unit: "second",
      model: null,
      costCents: input.costCents,
      billable: true,
      idempotencyKey: `${input.runId}:${input.nodeId}:sandbox`,
    })
    .onConflictDoNothing();
}

// ─── Plan & subscription ──────────────────────────────────────────────────────

export async function getActiveSubscription(db: Database, workspaceId: string) {
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
  const periodEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
  );

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
