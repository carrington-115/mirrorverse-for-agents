import { getDb } from "@mirrorverse/db";

import { handleStripeWebhook } from "../../../../src/features/billing/webhooks/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Static segment takes precedence over the dynamic `[slug]` route, so Stripe
// events get signature-verified by the dedicated handler instead of falling
// through to the generic inbound webhook dispatcher.
export function POST(req: Request): Promise<Response> {
  return handleStripeWebhook(req, getDb());
}
