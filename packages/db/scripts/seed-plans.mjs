// Seed the four billing plans (Free / Starter / Pro / Custom).
// Idempotent — safe to run repeatedly. Starter/Pro Stripe IDs come from
// `setup-stripe-products.mjs` run against the dev Stripe test account; replace
// them with IDs from your own Stripe account for other environments.
//
//   DATABASE_URL=... node packages/db/scripts/seed-plans.mjs

import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL must be set.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

const now = new Date().toISOString();

const plans = [
  {
    id: "free",
    name: "Free",
    stripe_product_id: "",
    stripe_monthly_price_id: null,
    stripe_annual_price_id: null,
    monthly_price_cents: 0,
    annual_price_cents: 0,
    display_order: 0,
    limits: {
      includedTokens: 500_000,
      includedCredits: 200,
      creditsPeriod: "day",
      includedVoiceMinutes: 0,
      includedSandboxSeconds: 0,
      maxWorkflows: 5,
      maxVoiceAgents: 0,
      maxPhoneNumbers: 0,
      maxConnections: 5,
      maxKnowledgeBases: 1,
      maxMembers: 1,
      maxRunsPerDay: null,
      maxRunsPerMonth: 100,
      maxWorkflowGenerationsPerPeriod: 5,
      maxFileUploadMb: 5,
    },
    features: {
      customMcpServers: false,
      codeNodes: false,
      voiceAgents: false,
      voiceToneConfig: false,
      knowledgeBases: true,
      skillsMarketplace: false,
      workflowEditorV0: false,
      auditLog: false,
      sso: false,
      prioritySupport: false,
      videoSupport: false,
    },
  },
  {
    id: "starter",
    name: "Starter",
    stripe_product_id: "prod_Uggd12LjkJ4DCv",
    stripe_monthly_price_id: "price_1ThJGGLJFHNVLYdNbxJA1eSH",
    stripe_annual_price_id: "price_1ThJGHLJFHNVLYdNkCgOLLAS",
    monthly_price_cents: 5000,
    annual_price_cents: 4000,
    display_order: 1,
    limits: {
      includedTokens: 5_000_000,
      includedCredits: 10_000,
      creditsPeriod: "billing_period",
      includedVoiceMinutes: 60,
      includedSandboxSeconds: 3600,
      maxWorkflows: null,
      maxVoiceAgents: 1,
      maxPhoneNumbers: 5,
      maxConnections: null,
      maxKnowledgeBases: 3,
      maxMembers: 5,
      maxRunsPerDay: null,
      maxRunsPerMonth: null,
      maxWorkflowGenerationsPerPeriod: 30,
      maxFileUploadMb: null,
    },
    features: {
      customMcpServers: false,
      codeNodes: true,
      voiceAgents: true,
      voiceToneConfig: true,
      knowledgeBases: true,
      skillsMarketplace: true,
      workflowEditorV0: true,
      auditLog: false,
      sso: false,
      prioritySupport: false,
      videoSupport: false,
    },
  },
  {
    id: "pro",
    name: "Pro",
    stripe_product_id: "prod_UggdnPngcqqevN",
    stripe_monthly_price_id: "price_1ThJGJLJFHNVLYdNFT6P69rG",
    stripe_annual_price_id: "price_1ThJGKLJFHNVLYdN5G1QnLAS",
    monthly_price_cents: 15000,
    annual_price_cents: 12000,
    display_order: 2,
    limits: {
      includedTokens: 50_000_000,
      includedCredits: 40_000,
      creditsPeriod: "billing_period",
      includedVoiceMinutes: 600,
      includedSandboxSeconds: 36000,
      maxWorkflows: null,
      maxVoiceAgents: null,
      maxPhoneNumbers: 20,
      maxConnections: null,
      maxKnowledgeBases: null,
      maxMembers: 25,
      maxRunsPerDay: 1000,
      maxRunsPerMonth: null,
      maxWorkflowGenerationsPerPeriod: null,
      maxFileUploadMb: null,
    },
    features: {
      customMcpServers: true,
      codeNodes: true,
      voiceAgents: true,
      voiceToneConfig: true,
      knowledgeBases: true,
      skillsMarketplace: true,
      workflowEditorV0: true,
      auditLog: true,
      sso: true,
      prioritySupport: true,
      videoSupport: true,
    },
  },
  {
    id: "custom",
    name: "Custom",
    stripe_product_id: "",
    stripe_monthly_price_id: null,
    stripe_annual_price_id: null,
    monthly_price_cents: 0,
    annual_price_cents: 0,
    display_order: 3,
    limits: {
      includedTokens: 500_000_000,
      includedCredits: 999_999,
      creditsPeriod: "billing_period",
      includedVoiceMinutes: 9999,
      includedSandboxSeconds: 999999,
      maxWorkflows: null,
      maxVoiceAgents: null,
      maxPhoneNumbers: null,
      maxConnections: null,
      maxKnowledgeBases: null,
      maxMembers: null,
      maxRunsPerDay: null,
      maxRunsPerMonth: null,
      maxWorkflowGenerationsPerPeriod: null,
      maxFileUploadMb: null,
    },
    features: {
      customMcpServers: true,
      codeNodes: true,
      voiceAgents: true,
      voiceToneConfig: true,
      knowledgeBases: true,
      skillsMarketplace: true,
      workflowEditorV0: true,
      auditLog: true,
      sso: true,
      prioritySupport: true,
      videoSupport: true,
    },
  },
];

for (const plan of plans) {
  await sql`
    INSERT INTO plans (
      id, name, stripe_product_id,
      stripe_monthly_price_id, stripe_annual_price_id,
      monthly_price_cents, annual_price_cents,
      limits, features, is_active, display_order,
      created_at, updated_at
    ) VALUES (
      ${plan.id}, ${plan.name}, ${plan.stripe_product_id},
      ${plan.stripe_monthly_price_id}, ${plan.stripe_annual_price_id},
      ${plan.monthly_price_cents}, ${plan.annual_price_cents},
      ${JSON.stringify(plan.limits)}::jsonb, ${JSON.stringify(plan.features)}::jsonb,
      true, ${plan.display_order},
      ${now}, ${now}
    )
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      stripe_product_id = EXCLUDED.stripe_product_id,
      stripe_monthly_price_id = EXCLUDED.stripe_monthly_price_id,
      stripe_annual_price_id = EXCLUDED.stripe_annual_price_id,
      monthly_price_cents = EXCLUDED.monthly_price_cents,
      annual_price_cents = EXCLUDED.annual_price_cents,
      limits = EXCLUDED.limits,
      features = EXCLUDED.features,
      display_order = EXCLUDED.display_order,
      updated_at = EXCLUDED.updated_at
  `;
  console.log(`  upserted plan: ${plan.id}`);
}

await sql.end();
console.log("Done seeding plans.");
