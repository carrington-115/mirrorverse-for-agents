import { and, eq, isNull, schema, type Database } from "@mirrorverse/db";
import type { UserId } from "@mirrorverse/types";

import { env } from "@mirrorverse/env/backend";
import { stripe } from "../billing/stripe-client";
import { addPeriod } from "../billing/enforcement";
import {
  ensureWorkspaceStripeCustomer,
  getFreePlan,
  upsertSubscription,
} from "../billing/repo";

const { workspaces, workspaceMembers, userProfiles } = schema;

const DEFAULT_PLAN_ID = "free";

interface InsertWorkspaceAndMemberArgs {
  readonly name: string;
  readonly slug: string;
  readonly ownerId: UserId;
}

async function insertWorkspaceAndMember(
  db: Database,
  args: InsertWorkspaceAndMemberArgs,
) {
  return db.transaction(async (tx) => {
    const [workspace] = await tx
      .insert(workspaces)
      .values({
        slug: args.slug,
        name: args.name,
        planId: DEFAULT_PLAN_ID,
        ownerId: args.ownerId,
      })
      .onConflictDoNothing({ target: workspaces.slug })
      .returning();
    if (!workspace) return null;
    await tx.insert(workspaceMembers).values({
      workspaceId: workspace.id,
      userId: args.ownerId,
      role: "owner",
      acceptedAt: new Date(),
    });
    return workspace;
  });
}

// Resolves the user's implicit workspace. B2C: one workspace per user.
//
// Race-safety: a single user can fire many parallel requests on page load
// (workflows.list, chats.list, auth.me, etc.). Every protected procedure
// runs through workspaceProc, which calls this. Earlier we used a slug with
// Date.now() and created a fresh workspace on every "no default" path, which
// meant concurrent first-time-callers each spawned a different workspace
// and the user ended up with several, only the most recently-written default
// being queryable.
//
// New flow:
//   1. If profile.defaultWorkspaceId is set, return it.
//   2. Otherwise look up any workspace already owned by this user. If one
//      exists (raced sibling already created it, or earlier session did),
//      adopt it: set defaultWorkspaceId and return it.
//   3. Otherwise insert a new workspace with a DETERMINISTIC slug (`u-<userId>`).
//      The unique slug index serialises concurrent inserts; the loser gets
//      no row from ON CONFLICT DO NOTHING and falls back to lookup-by-slug.
export async function ensureUserWorkspace(
  db: Database,
  userId: UserId,
): Promise<string> {
  const [profile] = await db
    .select({
      defaultWorkspaceId: userProfiles.defaultWorkspaceId,
      email: userProfiles.email,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);

  if (profile?.defaultWorkspaceId) return profile.defaultWorkspaceId;

  const [existing] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.ownerId, userId))
    .limit(1);
  if (existing) {
    await db
      .update(userProfiles)
      .set({ defaultWorkspaceId: existing.id })
      .where(
        and(
          eq(userProfiles.id, userId),
          isNull(userProfiles.defaultWorkspaceId),
        ),
      );
    return existing.id;
  }

  const slug = `u-${userId}`;
  const inserted = await insertWorkspaceAndMember(db, {
    name: profile?.email ? profile.email.split("@")[0]! : "Personal",
    slug,
    ownerId: userId,
  });
  if (inserted) {
    await db
      .update(userProfiles)
      .set({ defaultWorkspaceId: inserted.id })
      .where(
        and(
          eq(userProfiles.id, userId),
          isNull(userProfiles.defaultWorkspaceId),
        ),
      );
    void bootstrapWorkspaceBilling(db, inserted.id, profile?.email ?? null);
    return inserted.id;
  }

  const [byslug] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);
  if (!byslug) {
    throw new Error("Workspace insert + lookup both failed");
  }
  await db
    .update(userProfiles)
    .set({ defaultWorkspaceId: byslug.id })
    .where(
      and(eq(userProfiles.id, userId), isNull(userProfiles.defaultWorkspaceId)),
    );
  return byslug.id;
}

// Fire-and-forget: creates a Stripe customer + local subscription row for a
// newly created workspace. Errors are logged but never propagate — a failed
// bootstrap can be retried manually without breaking workspace access.
async function bootstrapWorkspaceBilling(
  db: Database,
  workspaceId: string,
  email: string | null,
): Promise<void> {
  try {
    const [ws] = await db
      .select({ stripeCustomerId: workspaces.stripeCustomerId })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (ws?.stripeCustomerId) return; // already bootstrapped

    if (email) {
      await db
        .update(workspaces)
        .set({ billingEmail: email })
        .where(eq(workspaces.id, workspaceId));
    }

    const stripeCustomerId = await ensureWorkspaceStripeCustomer(
      db,
      workspaceId,
    );

    const freePlan = await getFreePlan(db);
    const now = new Date();
    const periodEnd = addPeriod(
      freePlan?.limits.creditsPeriod ?? "billing_period",
      now,
    );

    // If Stripe is configured and the free plan has a Stripe price, create a
    // real Stripe subscription. Otherwise use a stable manual ID as a placeholder.
    let stripeSubId = `manual-free-${workspaceId}`;
    if (env.STRIPE_SECRET_KEY && freePlan?.stripeMonthlyPriceId) {
      const sub = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: freePlan.stripeMonthlyPriceId }],
      });
      stripeSubId = sub.id;
    }

    await upsertSubscription(db, {
      workspaceId,
      stripeSubscriptionId: stripeSubId,
      stripeCustomerId,
      planId: "free",
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
      defaultPaymentMethod: null,
    });
  } catch (err) {
    console.error("[billing] bootstrapWorkspaceBilling failed:", err);
  }
}
