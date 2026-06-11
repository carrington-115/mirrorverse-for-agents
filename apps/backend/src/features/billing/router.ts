import { z } from "zod";

import { eq, schema } from "@mirrorverse/db";

import { env } from "@mirrorverse/env/backend";

import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { stripe } from "./stripe-client";
import {
  getActiveSubscription,
  getDailyUsageAggregates,
  getDailyCreditUsage,
  listInvoices,
  getUsageThisPeriod,
  countRunsToday,
  countGenerationsThisPeriod,
  countConnectionsInWorkspace,
  ensureWorkspaceFreeSubscription,
} from "./repo";

const { plans, workspaces } = schema;

export const billingRouter = router({
  getCurrentPlan: workspaceProc.query(async ({ ctx }) => {
    let row = await getActiveSubscription(ctx.db, ctx.workspaceId);
    if (!row) {
      await ensureWorkspaceFreeSubscription(ctx.db, ctx.workspaceId);
      row = await getActiveSubscription(ctx.db, ctx.workspaceId);
    }
    if (!row) {
      return { plan: null, subscription: null, limits: null };
    }
    return {
      plan: row.plan,
      subscription: row.subscription,
      limits: row.plan.limits,
    };
  }),

  openCustomerPortal: workspaceProc
    .input(z.object({ returnUrl: z.string().url().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [ws] = await ctx.db
        .select({ stripeCustomerId: workspaces.stripeCustomerId })
        .from(workspaces)
        .where(eq(workspaces.id, ctx.workspaceId))
        .limit(1);

      if (!ws?.stripeCustomerId) {
        throw new Error("No Stripe customer found for this workspace");
      }

      const returnUrl = input.returnUrl ?? `${env.APP_URL}/settings/billing`;

      const session = await stripe.billingPortal.sessions.create({
        customer: ws.stripeCustomerId,
        return_url: returnUrl,
      });

      return { url: session.url };
    }),

  createCheckoutSession: workspaceProc
    .input(
      z.object({
        planId: z.enum(["starter", "pro"]),
        billingInterval: z.enum(["monthly", "annual"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Look up the plan's Stripe price ID
      const [plan] = await ctx.db
        .select({
          stripeMonthlyPriceId: plans.stripeMonthlyPriceId,
          stripeAnnualPriceId: plans.stripeAnnualPriceId,
        })
        .from(plans)
        .where(eq(plans.id, input.planId))
        .limit(1);

      const stripePriceId =
        input.billingInterval === "annual"
          ? plan?.stripeAnnualPriceId
          : plan?.stripeMonthlyPriceId;

      if (!stripePriceId) {
        throw new Error(
          `No Stripe price ID configured for plan "${input.planId}" (${input.billingInterval}). Add the price ID to the plans table.`,
        );
      }

      // Look up or create Stripe customer for this workspace
      const [ws] = await ctx.db
        .select({ stripeCustomerId: workspaces.stripeCustomerId })
        .from(workspaces)
        .where(eq(workspaces.id, ctx.workspaceId))
        .limit(1);

      if (!ws?.stripeCustomerId) {
        throw new Error("No Stripe customer found for this workspace");
      }

      const successUrl = `${env.APP_URL}/settings/billing?checkout=success`;
      const cancelUrl = `${env.APP_URL}/settings/billing`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: ws.stripeCustomerId,
        line_items: [{ price: stripePriceId, quantity: 1 }],
        automatic_tax: { enabled: true },
        customer_update: { address: "auto" },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { workspaceId: ctx.workspaceId },
      });

      if (!session.url) {
        throw new Error("Stripe did not return a checkout URL");
      }

      return { url: session.url };
    }),

  listInvoices: workspaceProc
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      return listInvoices(ctx.db, ctx.workspaceId, input.limit);
    }),

  usageByDay: workspaceProc.query(async ({ ctx }) => {
    const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
    const periodStart =
      sub?.subscription.currentPeriodStart ??
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = sub?.subscription.currentPeriodEnd ?? new Date();
    return getDailyUsageAggregates(
      ctx.db,
      ctx.workspaceId,
      periodStart,
      periodEnd,
    );
  }),

  usageThisPeriod: workspaceProc.query(async ({ ctx }) => {
    const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
    const periodStart = sub?.subscription.currentPeriodStart ?? new Date(0);
    const periodEnd = sub?.subscription.currentPeriodEnd ?? new Date();
    const usage = await getUsageThisPeriod(
      ctx.db,
      ctx.workspaceId,
      periodStart,
      periodEnd,
    );
    return { periodStart, periodEnd, usage };
  }),

  dailyCreditUsage: workspaceProc.query(async ({ ctx }) => {
    const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
    const periodStart =
      sub?.subscription.currentPeriodStart ??
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const periodEnd = sub?.subscription.currentPeriodEnd ?? new Date();
    return getDailyCreditUsage(ctx.db, ctx.workspaceId, periodStart, periodEnd);
  }),

  getCapacityCounts: workspaceProc.query(async ({ ctx }) => {
    const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
    const periodStart =
      sub?.subscription.currentPeriodStart ??
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [runsToday, generationsThisPeriod, connectionsCount] =
      await Promise.all([
        countRunsToday(ctx.db, ctx.workspaceId),
        countGenerationsThisPeriod(ctx.db, ctx.workspaceId, periodStart),
        countConnectionsInWorkspace(ctx.db, ctx.workspaceId),
      ]);

    return { runsToday, generationsThisPeriod, connectionsCount };
  }),
});
