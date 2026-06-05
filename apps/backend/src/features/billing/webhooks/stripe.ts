import type Stripe from "stripe";

import { eq, schema, type Database } from "@mirrorverse/db";

import { env } from "@mirrorverse/env/backend";

import { stripe } from "../stripe-client";
import { upsertSubscription, upsertInvoice } from "../repo";
import { sendBillingEmail } from "../../notifications/email";

const { workspaces, subscriptions, userProfiles } = schema;

async function resolveWorkspaceId(
  db: Database,
  stripeCustomerId: string,
): Promise<string | null> {
  const [ws] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(eq(workspaces.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return ws?.id ?? null;
}

async function resolveOwnerEmail(
  db: Database,
  workspaceId: string,
): Promise<string | null> {
  const [ws] = await db
    .select({ ownerId: workspaces.ownerId })
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!ws) return null;

  const [profile] = await db
    .select({
      email: userProfiles.email,
      emailOptOut: userProfiles.emailOptOut,
    })
    .from(userProfiles)
    .where(eq(userProfiles.id, ws.ownerId))
    .limit(1);
  return profile && !profile.emailOptOut ? profile.email : null;
}

async function resolveSubscriptionDbId(
  db: Database,
  stripeSubscriptionId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return row?.id ?? null;
}

async function handleSubscriptionEvent(
  db: Database,
  sub: Stripe.Subscription,
): Promise<void> {
  const workspaceId = await resolveWorkspaceId(db, sub.customer as string);
  if (!workspaceId) {
    console.warn(
      `[stripe-webhook] no workspace for customer ${sub.customer as string}`,
    );
    return;
  }

  // Derive planId from subscription metadata (set when creating the subscription)
  const planId = (sub.metadata["planId"] as string | undefined) ?? "free";

  // In Stripe API 2026+, current_period_start/end moved to SubscriptionItem
  const firstItem = sub.items.data[0];
  const currentPeriodStart = firstItem?.current_period_start
    ? new Date(firstItem.current_period_start * 1000)
    : new Date();
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await upsertSubscription(db, {
    workspaceId,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: sub.customer as string,
    planId,
    status: sub.status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialEndsAt: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    defaultPaymentMethod:
      typeof sub.default_payment_method === "string"
        ? sub.default_payment_method
        : (sub.default_payment_method?.id ?? null),
  });
}

async function handleInvoiceEvent(
  db: Database,
  inv: Stripe.Invoice,
): Promise<void> {
  const workspaceId = await resolveWorkspaceId(db, inv.customer as string);
  if (!workspaceId) {
    console.warn(
      `[stripe-webhook] no workspace for customer ${inv.customer as string}`,
    );
    return;
  }

  // In Stripe API 2026+, subscription is nested under parent.subscription_details
  const stripeSubscriptionId =
    inv.parent?.type === "subscription_details" &&
    inv.parent.subscription_details?.subscription
      ? typeof inv.parent.subscription_details.subscription === "string"
        ? inv.parent.subscription_details.subscription
        : inv.parent.subscription_details.subscription.id
      : null;

  const subscriptionId = stripeSubscriptionId
    ? await resolveSubscriptionDbId(db, stripeSubscriptionId)
    : null;

  // Tax amount: sum from total_taxes array (replaces the removed `tax` field)
  const taxCents = inv.total_taxes
    ? inv.total_taxes.reduce((sum, t) => sum + (t.amount ?? 0), 0)
    : 0;

  await upsertInvoice(db, {
    workspaceId,
    stripeInvoiceId: inv.id ?? `inv-${Date.now()}`,
    subscriptionId,
    periodStart: new Date((inv.period_start ?? 0) * 1000),
    periodEnd: new Date((inv.period_end ?? 0) * 1000),
    status: (inv.status ?? "open") as
      | "draft"
      | "open"
      | "paid"
      | "uncollectible"
      | "void",
    subtotalCents: inv.subtotal,
    taxCents,
    totalCents: inv.total,
    amountPaidCents: inv.amount_paid,
    amountDueCents: inv.amount_due,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdfUrl: inv.invoice_pdf ?? null,
    paidAt: inv.status_transitions?.paid_at
      ? new Date(inv.status_transitions.paid_at * 1000)
      : null,
  });
}

export async function handleStripeWebhook(
  req: Request,
  db: Database,
): Promise<Response> {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } else {
      console.warn(
        "[stripe-webhook] STRIPE_WEBHOOK_SECRET not set — skipping signature verification",
      );
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error("[stripe-webhook] signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionEvent(db, sub);

        if (event.type === "customer.subscription.updated") {
          const prevPlanId = event.data.previous_attributes?.["metadata"]
            ? (
                (event.data.previous_attributes as Record<string, unknown>)[
                  "metadata"
                ] as Record<string, string> | undefined
              )?.["planId"]
            : undefined;
          const newPlanId =
            (sub.metadata["planId"] as string | undefined) ?? "free";
          if (prevPlanId && prevPlanId !== newPlanId) {
            const workspaceId = await resolveWorkspaceId(
              db,
              sub.customer as string,
            );
            if (workspaceId) {
              const email = await resolveOwnerEmail(db, workspaceId);
              if (email) {
                sendBillingEmail(email, {
                  variant: "plan_upgraded",
                  newPlan: newPlanId,
                  appUrl: env.APP_URL,
                }).catch((err) =>
                  console.error(
                    "[stripe-webhook] plan_upgraded email failed:",
                    err,
                  ),
                );
              }
            }
          }
        }
        break;
      }
      case "customer.subscription.trial_will_end": {
        const sub = event.data.object as Stripe.Subscription;
        const workspaceId = await resolveWorkspaceId(
          db,
          sub.customer as string,
        );
        if (workspaceId) {
          const email = await resolveOwnerEmail(db, workspaceId);
          if (email) {
            const trialEnd = sub.trial_end ?? 0;
            const daysLeft = Math.max(
              1,
              Math.round(
                (trialEnd * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
              ),
            );
            sendBillingEmail(email, {
              variant: "trial_ending",
              daysLeft,
              upgradeUrl: `${env.APP_URL}/settings/billing`,
            }).catch((err) =>
              console.error("[stripe-webhook] trial_ending email failed:", err),
            );
          }
        }
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        await handleInvoiceEvent(db, inv);
        const workspaceId = await resolveWorkspaceId(
          db,
          inv.customer as string,
        );
        if (workspaceId) {
          const email = await resolveOwnerEmail(db, workspaceId);
          if (email && inv.hosted_invoice_url) {
            sendBillingEmail(email, {
              variant: "invoice_paid",
              invoiceUrl: inv.hosted_invoice_url,
              totalCents: inv.total,
            }).catch((err) =>
              console.error("[stripe-webhook] invoice_paid email failed:", err),
            );
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        await handleInvoiceEvent(db, inv);
        const workspaceId = await resolveWorkspaceId(
          db,
          inv.customer as string,
        );
        if (workspaceId) {
          const email = await resolveOwnerEmail(db, workspaceId);
          if (email) {
            sendBillingEmail(email, {
              variant: "payment_failed",
              portalUrl: `${env.APP_URL}/settings/billing`,
            }).catch((err) =>
              console.error(
                "[stripe-webhook] payment_failed email failed:",
                err,
              ),
            );
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe-webhook] error handling ${event.type}:`, err);
    return new Response("Handler error", { status: 500 });
  }

  return new Response("OK", { status: 200 });
}
