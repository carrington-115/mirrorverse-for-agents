import type {
  ChatId,
  Cents,
  InvoiceId,
  PlanId,
  SubscriptionId,
  Tenanted,
  Timestamps,
  Tokens,
  UsageEventId,
  WorkflowRunId,
} from "./common.js";

export type PlanSlug = "free" | "starter" | "pro" | "business" | "enterprise";

export interface Plan extends Timestamps {
  readonly id: PlanId;
  readonly slug: PlanSlug;
  readonly name: string;
  readonly stripeProductId: string;
  readonly stripeMonthlyPriceId: string | null;
  readonly stripeAnnualPriceId: string | null;
  readonly monthlyPriceCents: Cents;
  readonly annualPriceCents: Cents;
  readonly limits: PlanLimits;
  readonly features: PlanFeatures;
  readonly isActive: boolean;
  readonly displayOrder: number;
}

export interface PlanLimits {
  readonly includedTokens: Tokens;
  readonly includedVoiceMinutes: number;
  readonly includedSandboxSeconds: number;
  readonly maxWorkflows: number | null;
  readonly maxVoiceAgents: number | null;
  readonly maxConnections: number | null;
  readonly maxKnowledgeBases: number | null;
  readonly maxMembers: number | null;
}

export interface PlanFeatures {
  readonly customMcpServers: boolean;
  readonly codeNodes: boolean;
  readonly voiceAgents: boolean;
  readonly knowledgeBases: boolean;
  readonly skillsMarketplace: boolean;
  readonly auditLog: boolean;
  readonly sso: boolean;
  readonly prioritySupport: boolean;
}

export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "incomplete"
  | "unpaid";

/** Local mirror of a Stripe subscription. */
export interface Subscription extends Timestamps, Tenanted {
  readonly id: SubscriptionId;
  readonly stripeSubscriptionId: string;
  readonly planId: PlanId;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: Date;
  readonly currentPeriodEnd: Date;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEndsAt: Date | null;
  readonly defaultPaymentMethod: string | null;
}

export type UsageKind =
  | "llm_input"
  | "llm_input_cache_write"
  | "llm_input_cache_read"
  | "llm_output"
  | "embedding"
  | "voice_minute"
  | "sandbox_second"
  | "composio_action"
  | "phone_number_month"
  | "storage_gb_month";

/**
 * Append-only consumption log. Source of truth for billing — aggregates are
 * rebuildable from here.
 */
export interface UsageEvent extends Timestamps, Tenanted {
  readonly id: UsageEventId;
  readonly kind: UsageKind;
  readonly quantity: number;
  readonly unit: string;
  readonly model: string | null;
  readonly costCents: Cents;
  readonly billable: boolean;
  readonly runId: WorkflowRunId | null;
  readonly chatId: ChatId | null;
  readonly occurredAt: Date;
  readonly idempotencyKey: string;
}

/** Hourly / daily / monthly rollup of `UsageEvent` rows. */
export interface UsagePeriodAggregate {
  readonly workspaceId: Tenanted["workspaceId"];
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly granularity: "hour" | "day" | "month";
  readonly kind: UsageKind;
  readonly totalQuantity: number;
  readonly totalCostCents: Cents;
}

export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void";

export interface Invoice extends Timestamps, Tenanted {
  readonly id: InvoiceId;
  readonly stripeInvoiceId: string;
  readonly subscriptionId: SubscriptionId;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly status: InvoiceStatus;
  readonly subtotalCents: Cents;
  readonly taxCents: Cents;
  readonly totalCents: Cents;
  readonly amountPaidCents: Cents;
  readonly amountDueCents: Cents;
  readonly hostedInvoiceUrl: string | null;
  readonly invoicePdfUrl: string | null;
  readonly paidAt: Date | null;
}

/** Real-time gate used at the request edge to refuse over-quota work. */
export interface QuotaCheck {
  readonly kind: UsageKind;
  readonly used: number;
  readonly limit: number | null;
  readonly remaining: number | null;
  readonly periodEnd: Date;
  readonly hardCap: boolean;
}
