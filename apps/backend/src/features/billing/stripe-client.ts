import Stripe from "stripe";

import { env } from "@mirrorverse/env/backend";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set — add it to .env to use billing features",
    );
  }
  _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
  });
  return _stripe;
}

// Lazy proxy so this module can be imported safely when STRIPE_SECRET_KEY is
// absent (local dev without a Stripe account). The real client is created on
// first property access, which happens inside route handlers — not at startup.
export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getStripe(), prop);
  },
});
