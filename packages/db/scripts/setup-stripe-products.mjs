// One-off script: creates Stripe Products + Prices for the paid plans
// (Starter, Pro) and prints the resulting IDs to paste into
// `packages/db/scripts/seed-plans.mjs`. Idempotent — re-running it finds and
// reuses products/prices already tagged with the plan's metadata instead of
// creating duplicates.
//
//   STRIPE_SECRET_KEY=sk_test_... node packages/db/scripts/setup-stripe-products.mjs

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY must be set.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
});

// monthlyPriceCents / annualPriceCents mirror seed-plans.mjs: annualPriceCents
// is the displayed monthly-equivalent rate when billed annually, so the
// actual yearly Price charges 12x that amount.
const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "For small teams automating their first workflows.",
    monthlyPriceCents: 5000,
    annualPriceCents: 4000,
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams with advanced needs.",
    monthlyPriceCents: 15000,
    annualPriceCents: 12000,
  },
];

async function findOrCreateProduct(plan) {
  const existingProducts = await stripe.products.list({ active: true, limit: 100 });
  const found = existingProducts.data.find((p) => p.metadata.planId === plan.id);
  if (found) return found;

  return stripe.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { planId: plan.id },
  });
}

async function findOrCreatePrice(product, plan, interval) {
  const existingPrices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const found = existingPrices.data.find((p) => p.metadata.interval === interval);
  if (found) return found;

  const unitAmount = interval === "annual" ? plan.annualPriceCents * 12 : plan.monthlyPriceCents;

  return stripe.prices.create({
    product: product.id,
    currency: "usd",
    unit_amount: unitAmount,
    recurring: { interval: interval === "annual" ? "year" : "month" },
    metadata: { planId: plan.id, interval },
  });
}

for (const plan of plans) {
  const product = await findOrCreateProduct(plan);
  const monthlyPrice = await findOrCreatePrice(product, plan, "monthly");
  const annualPrice = await findOrCreatePrice(product, plan, "annual");

  console.log(`\n${plan.id}:`);
  console.log(`  stripe_product_id: "${product.id}"`);
  console.log(`  stripe_monthly_price_id: "${monthlyPrice.id}"`);
  console.log(`  stripe_annual_price_id: "${annualPrice.id}"`);
}

console.log("\nDone. Paste the IDs above into packages/db/scripts/seed-plans.mjs.");
