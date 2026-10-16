import { z } from "zod";

import { eq, schema } from "@mirrorverse/db";

import { env } from "@mirrorverse/env/backend";

import { router, TRPCError } from "../../trpc/init";
import { workspaceProc } from "../../trpc/middleware";
import { getCreditPeriodBounds, remainingBonusCredits } from "./enforcement";
import {
  listPromoRedemptions,
  PromoCodeError,
  redeemPromoCode,
  settleBonusCredits,
  type PromoCodeErrorReason,
} from "./promo-repo";
import { stripe } from "./stripe-client";
import {
  getActiveSubscription,
  getActiveSubscriptionUncached,
  getDailyUsageAggregates,
  getDailyCreditUsage,
  listInvoices,
  getUsageThisPeriod,
  countRunsToday,
  countRunsThisPeriod,
  countGenerationsThisPeriod,
  countConnectionsInWorkspace,
  ensureWorkspaceFreeSubscription,
  ensureWorkspaceStripeCustomer,
} from "./repo";

const { plans } = schema;

const PROMO_ERRORS: Record<
  PromoCodeErrorReason,
  {
    code: "NOT_FOUND" | "BAD_REQUEST" | "FORBIDDEN" | "CONFLICT";
    message: string;
  }
> = {
  not_found: { code: "NOT_FOUND", message: "That promo code isn't valid." },
  not_started: {
    code: "BAD_REQUEST",
    message: "That promo code isn't active yet.",
  },
  expired: { code: "BAD_REQUEST", message: "That promo code has expired." },
  not_eligible: {
    code: "FORBIDDEN",
    message:
      "That promo code is only for registered event participants. Sign in with the email you registered with.",
  },
  exhausted: {
    code: "BAD_REQUEST",
    message: "That promo code has reached its redemption limit.",
  },
  already_redeemed: {
    code: "CONFLICT",
    message: "This workspace has already redeemed that promo code.",
  },
};

export const billingRouter = router({
  // Uncached: the settings page shows the payment method and Stripe ids, which
  // are kept out of the subscription cache.
  getCurrentPlan: workspaceProc.query(async ({ ctx }) => {
    let row = await getActiveSubscriptionUncached(ctx.db, ctx.workspaceId);
    if (!row) {
      await ensureWorkspaceFreeSubscription(ctx.db, ctx.workspaceId);
      row = await getActiveSubscriptionUncached(ctx.db, ctx.workspaceId);
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
      const stripeCustomerId = await ensureWorkspaceStripeCustomer(
        ctx.db,
        ctx.workspaceId,
      );

      const returnUrl = input.returnUrl ?? `${env.APP_URL}/settings/billing`;

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
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
      const stripeCustomerId = await ensureWorkspaceStripeCustomer(
        ctx.db,
        ctx.workspaceId,
      );

      const successUrl = `${env.APP_URL}/settings/billing?checkout=success`;
      const cancelUrl = `${env.APP_URL}/settings/billing`;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: stripeCustomerId,
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
    const { periodStart, periodEnd } = getCreditPeriodBounds(
      sub?.plan.limits,
      sub?.subscription,
    );
    const includedCredits = sub?.plan.limits.includedCredits ?? 0;
    const [usage, bonusPool] = await Promise.all([
      getUsageThisPeriod(ctx.db, ctx.workspaceId, periodStart, periodEnd),
      settleBonusCredits(ctx.db, ctx.workspaceId, includedCredits, {
        periodStart,
        periodEnd,
      }),
    ]);
    const usedCredits = usage.reduce((sum, u) => sum + u.totalCredits, 0);
    const bonusCredits = bonusPool
      ? {
          granted: bonusPool.grantedCredits,
          remaining: remainingBonusCredits(
            bonusPool,
            usedCredits,
            includedCredits,
          ),
        }
      : null;
    return { periodStart, periodEnd, usage, bonusCredits };
  }),

  redeemPromoCode: workspaceProc
    .input(z.object({ code: z.string().trim().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      const sub = await getActiveSubscription(ctx.db, ctx.workspaceId);
      const period = getCreditPeriodBounds(sub?.plan.limits, sub?.subscription);
      try {
        return await redeemPromoCode(ctx.db, {
          workspaceId: ctx.workspaceId,
          userId: ctx.user.id,
          email: ctx.user.email,
          code: input.code,
          includedCredits: sub?.plan.limits.includedCredits ?? 0,
          period,
        });
      } catch (err) {
        if (err instanceof PromoCodeError) {
          throw new TRPCError(PROMO_ERRORS[err.reason]);
        }
        throw err;
      }
    }),

  listPromoRedemptions: workspaceProc.query(async ({ ctx }) => {
    return listPromoRedemptions(ctx.db, ctx.workspaceId);
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

    const [runsToday, runsThisPeriod, generationsThisPeriod, connectionsCount] =
      await Promise.all([
        countRunsToday(ctx.db, ctx.workspaceId),
        countRunsThisPeriod(ctx.db, ctx.workspaceId, periodStart),
        countGenerationsThisPeriod(ctx.db, ctx.workspaceId, periodStart),
        countConnectionsInWorkspace(ctx.db, ctx.workspaceId),
      ]);

    return {
      runsToday,
      runsThisPeriod,
      generationsThisPeriod,
      connectionsCount,
    };
  }),
});
