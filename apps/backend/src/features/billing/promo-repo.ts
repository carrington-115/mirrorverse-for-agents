import {
  and,
  desc,
  eq,
  isNull,
  lt,
  or,
  schema,
  sql,
  type Database,
} from "@mirrorverse/db";
import { centsToCredits } from "@mirrorverse/agent";

import { bonusOverage } from "./enforcement";
import { getTotalCreditsByPeriod } from "./repo";

const { promoCodes, promoRedemptions, workspaceBonusCredits } = schema;

interface CreditPeriod {
  readonly periodStart: Date;
  readonly periodEnd: Date;
}

export type PromoCodeErrorReason =
  | "not_found"
  | "not_started"
  | "expired"
  | "exhausted"
  | "already_redeemed";

export class PromoCodeError extends Error {
  constructor(public readonly reason: PromoCodeErrorReason) {
    super(`Promo code rejected: ${reason}`);
    this.name = "PromoCodeError";
  }
}

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

// Moves the previous period's overage (usage beyond the plan's hard cap) into
// `consumedCredits` once the credit period has rolled over. The conditional
// update on `trackedPeriodStart` makes concurrent settlements apply once.
export async function settleBonusCredits(
  db: Database,
  workspaceId: string,
  includedCredits: number,
  period: CreditPeriod,
) {
  const [pool] = await db
    .select()
    .from(workspaceBonusCredits)
    .where(eq(workspaceBonusCredits.workspaceId, workspaceId))
    .limit(1);
  if (!pool) return null;
  if (pool.trackedPeriodStart.getTime() === period.periodStart.getTime())
    return pool;

  const previousUsed = await getTotalCreditsByPeriod(
    db,
    workspaceId,
    pool.trackedPeriodStart,
    pool.trackedPeriodEnd,
  );
  const consumedCredits = Math.min(
    pool.grantedCredits,
    pool.consumedCredits +
      Math.round(bonusOverage(previousUsed, includedCredits)),
  );

  const [updated] = await db
    .update(workspaceBonusCredits)
    .set({
      consumedCredits,
      trackedPeriodStart: period.periodStart,
      trackedPeriodEnd: period.periodEnd,
    })
    .where(
      and(
        eq(workspaceBonusCredits.workspaceId, workspaceId),
        eq(workspaceBonusCredits.trackedPeriodStart, pool.trackedPeriodStart),
      ),
    )
    .returning();
  if (updated) return updated;

  const [current] = await db
    .select()
    .from(workspaceBonusCredits)
    .where(eq(workspaceBonusCredits.workspaceId, workspaceId))
    .limit(1);
  return current ?? null;
}

export async function redeemPromoCode(
  db: Database,
  input: {
    workspaceId: string;
    userId: string;
    code: string;
    includedCredits: number;
    period: CreditPeriod;
  },
): Promise<{ code: string; credits: number; valueCents: number }> {
  const code = normalizePromoCode(input.code);
  const [promo] = await db
    .select()
    .from(promoCodes)
    .where(and(eq(promoCodes.code, code), eq(promoCodes.isActive, true)))
    .limit(1);
  if (!promo) throw new PromoCodeError("not_found");

  const now = new Date();
  if (promo.startsAt > now) throw new PromoCodeError("not_started");
  if (promo.expiresAt && promo.expiresAt <= now)
    throw new PromoCodeError("expired");

  const [existing] = await db
    .select({ id: promoRedemptions.id })
    .from(promoRedemptions)
    .where(
      and(
        eq(promoRedemptions.promoCodeId, promo.id),
        eq(promoRedemptions.workspaceId, input.workspaceId),
      ),
    )
    .limit(1);
  if (existing) throw new PromoCodeError("already_redeemed");

  // Atomically claim a redemption slot so `maxRedemptions` can't be overshot.
  const [claimed] = await db
    .update(promoCodes)
    .set({ redemptionCount: sql`${promoCodes.redemptionCount} + 1` })
    .where(
      and(
        eq(promoCodes.id, promo.id),
        or(
          isNull(promoCodes.maxRedemptions),
          lt(promoCodes.redemptionCount, promoCodes.maxRedemptions),
        ),
      ),
    )
    .returning({ id: promoCodes.id });
  if (!claimed) throw new PromoCodeError("exhausted");

  const credits = centsToCredits(promo.valueCents);
  const [redemption] = await db
    .insert(promoRedemptions)
    .values({
      promoCodeId: promo.id,
      workspaceId: input.workspaceId,
      redeemedByUserId: input.userId,
      credits,
    })
    .onConflictDoNothing()
    .returning({ id: promoRedemptions.id });
  // Lost a race with a concurrent redemption; the caller's transaction rolls
  // back the slot claimed above.
  if (!redemption) throw new PromoCodeError("already_redeemed");

  // Settle any rolled-over period first so old overage isn't paid for with
  // credits granted afterwards.
  await settleBonusCredits(
    db,
    input.workspaceId,
    input.includedCredits,
    input.period,
  );
  await db
    .insert(workspaceBonusCredits)
    .values({
      workspaceId: input.workspaceId,
      grantedCredits: credits,
      trackedPeriodStart: input.period.periodStart,
      trackedPeriodEnd: input.period.periodEnd,
    })
    .onConflictDoUpdate({
      target: workspaceBonusCredits.workspaceId,
      set: {
        grantedCredits: sql`${workspaceBonusCredits.grantedCredits} + ${credits}`,
      },
    });

  return { code: promo.code, credits, valueCents: promo.valueCents };
}

export async function listPromoRedemptions(db: Database, workspaceId: string) {
  return db
    .select({
      id: promoRedemptions.id,
      code: promoCodes.code,
      credits: promoRedemptions.credits,
      valueCents: promoCodes.valueCents,
      createdAt: promoRedemptions.createdAt,
    })
    .from(promoRedemptions)
    .innerJoin(promoCodes, eq(promoRedemptions.promoCodeId, promoCodes.id))
    .where(eq(promoRedemptions.workspaceId, workspaceId))
    .orderBy(desc(promoRedemptions.createdAt));
}
