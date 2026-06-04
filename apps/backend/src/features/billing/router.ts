import { z } from "zod";

import { eq, schema } from "@mirrorverse/db";

import { env } from "@mirrorverse/env/backend";

import { router } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { stripe } from "./stripe-client";
import {
  getActiveSubscription,
  getDailyUsageAggregates,
  listInvoices,
  getUsageThisPeriod,
} from "./repo";

const { workspaces } = schema;

export const billingRouter = router({
  getCurrentPlan: workspaceProc.query(async ({ ctx }) => {
    const row = await getActiveSubscription(ctx.db, ctx.workspaceId);
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

      const returnUrl =
        input.returnUrl ??
        `${env.BACKEND_URL.replace("3001", "3000")}/settings/billing`;

      const session = await stripe.billingPortal.sessions.create({
        customer: ws.stripeCustomerId,
        return_url: returnUrl,
      });

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
});
