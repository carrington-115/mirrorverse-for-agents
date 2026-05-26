"use client";

import { useState } from "react";
import { Check, Minus, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const ANNUAL_DISCOUNT = 0.2;

interface Feature {
  label: string;
  value: string | boolean;
}

interface Plan {
  slug: string;
  name: string;
  monthlyPrice: number | null;
  description: string;
  cta: string;
  ctaHref: string;
  popular?: boolean;
  features: Feature[];
}

const plans: Plan[] = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: 0,
    description: "Explore the platform and build your first agent workflow — no card required.",
    cta: "Get started free",
    ctaHref: "https://app.mirrorverse.ai/sign-up",
    features: [
      { label: "Prompt-to-workflow generation", value: "5 / month" },
      { label: "Workflow editor", value: true },
      { label: "Workflow runs", value: "100 / month" },
      { label: "Apps", value: "1" },
      { label: "Knowledge bases", value: "1 (10 MB)" },
      { label: "Model access", value: "Standard" },
      { label: "Team members", value: "1" },
      { label: "Integrations", value: "3" },
      { label: "Analytics & monitoring", value: "Basic" },
      { label: "Sandboxed code execution", value: false },
      { label: "Phone numbers", value: false },
      { label: "Concurrent voice calls", value: false },
      { label: "API access", value: false },
      { label: "Webhooks", value: false },
      { label: "Audit log", value: false },
      { label: "SSO / SAML", value: false },
      { label: "Support", value: "Community" },
    ],
  },
  {
    slug: "starter",
    name: "Starter",
    monthlyPrice: 49,
    description: "For small teams automating their first real business processes.",
    cta: "Start with Starter",
    ctaHref: "https://app.mirrorverse.ai/sign-up?plan=starter",
    features: [
      { label: "Prompt-to-workflow generation", value: "50 / month" },
      { label: "Workflow editor", value: true },
      { label: "Workflow runs", value: "2,000 / month" },
      { label: "Apps", value: "5" },
      { label: "Knowledge bases", value: "3 (1 GB)" },
      { label: "Model access", value: "Standard + Pro" },
      { label: "Team members", value: "5" },
      { label: "Integrations", value: "15" },
      { label: "Analytics & monitoring", value: "Standard" },
      { label: "Sandboxed code execution", value: "Limited" },
      { label: "Phone numbers", value: "1" },
      { label: "Concurrent voice calls", value: "3" },
      { label: "API access", value: true },
      { label: "Webhooks", value: true },
      { label: "Audit log", value: "30 days" },
      { label: "SSO / SAML", value: false },
      { label: "Support", value: "Email" },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPrice: 149,
    description: "For fast-growing teams who need full model access, scale, and compliance.",
    cta: "Get Pro",
    ctaHref: "https://app.mirrorverse.ai/sign-up?plan=pro",
    popular: true,
    features: [
      { label: "Prompt-to-workflow generation", value: "Unlimited" },
      { label: "Workflow editor", value: "Full + advanced nodes" },
      { label: "Workflow runs", value: "20,000 / month" },
      { label: "Apps", value: "Unlimited" },
      { label: "Knowledge bases", value: "Unlimited (50 GB)" },
      { label: "Model access", value: "All models incl. Opus" },
      { label: "Team members", value: "25" },
      { label: "Integrations", value: "Unlimited" },
      { label: "Analytics & monitoring", value: "Advanced" },
      { label: "Sandboxed code execution", value: true },
      { label: "Phone numbers", value: "5" },
      { label: "Concurrent voice calls", value: "20" },
      { label: "API access", value: "Higher rate limits" },
      { label: "Webhooks", value: "Custom retry logic" },
      { label: "Audit log", value: "90 days" },
      { label: "SSO / SAML", value: true },
      { label: "Support", value: "Priority email + chat" },
    ],
  },
  {
    slug: "custom",
    name: "Custom",
    monthlyPrice: null,
    description: "Dedicated infrastructure, custom SLAs, and white-glove onboarding.",
    cta: "Talk to sales",
    ctaHref: "https://cal.com/frumark/mirrroagents",
    features: [
      { label: "Prompt-to-workflow generation", value: "Unlimited" },
      { label: "Workflow editor", value: "Full + advanced nodes" },
      { label: "Workflow runs", value: "Custom" },
      { label: "Apps", value: "Unlimited" },
      { label: "Knowledge bases", value: "Unlimited" },
      { label: "Model access", value: "All + fine-tuned models" },
      { label: "Team members", value: "Unlimited" },
      { label: "Integrations", value: "Unlimited" },
      { label: "Analytics & monitoring", value: "Custom dashboards" },
      { label: "Sandboxed code execution", value: true },
      { label: "Phone numbers", value: "Unlimited" },
      { label: "Concurrent voice calls", value: "Custom" },
      { label: "API access", value: "Unlimited" },
      { label: "Webhooks", value: true },
      { label: "Audit log", value: "Custom retention" },
      { label: "SSO / SAML", value: true },
      { label: "Support", value: "Dedicated manager + SLA" },
    ],
  },
];

const featureGroups: { label: string; keys: string[] }[] = [
  {
    label: "Workflows",
    keys: [
      "Prompt-to-workflow generation",
      "Workflow editor",
      "Workflow runs",
      "Apps",
      "Sandboxed code execution",
    ],
  },
  {
    label: "Data & AI",
    keys: ["Knowledge bases", "Model access", "Analytics & monitoring"],
  },
  {
    label: "Voice & Comms",
    keys: ["Phone numbers", "Concurrent voice calls"],
  },
  {
    label: "Platform",
    keys: ["Team members", "Integrations", "API access", "Webhooks"],
  },
  {
    label: "Security & Compliance",
    keys: ["Audit log", "SSO / SAML"],
  },
  {
    label: "Support",
    keys: ["Support"],
  },
];

function FeatureValue({ value, dark }: { value: string | boolean; dark?: boolean }) {
  if (value === true)
    return (
      <span
        className={cn(
          "h-5 w-5 flex items-center justify-center rounded-full",
          dark ? "bg-white/10" : "bg-[#f0f9ff]",
        )}
      >
        <Check
          className={cn("h-3 w-3", dark ? "text-white" : "text-[#0284c7]")}
          strokeWidth={2.5}
        />
      </span>
    );
  if (value === false)
    return <Minus className={cn("h-4 w-4", dark ? "text-white/25" : "text-[#d4d4d4]")} />;
  return (
    <span
      className={cn(
        "font-medium text-right text-[13px] leading-[20px]",
        dark ? "text-white/80" : "text-[#404040]",
      )}
    >
      {value}
    </span>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);

  function displayPrice(plan: Plan) {
    if (plan.monthlyPrice === null) return null;
    if (plan.monthlyPrice === 0) return 0;
    return annual ? Math.round(plan.monthlyPrice * (1 - ANNUAL_DISCOUNT)) : plan.monthlyPrice;
  }

  return (
    <section
      id="pricing"
      className="lg:px-[var(--spacing-120)] mx-auto mt-(--spacing-160) flex w-full max-w-[1440px] flex-col items-center gap-(--spacing-64) px-(--spacing-16)"
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-(--spacing-20) text-center">
        <h2 className="font-semibold text-3xl lg:text-[var(--heading-2-font-size)]/[var(--heading-2-line-height)] leading-[48px] tracking-[-1px] text-(--general-secondary-foreground,#171717)">
          Simple, transparent pricing
        </h2>
        <p className="text-sm lg:text-base font-normal max-w-[520px] leading-[24px] text-(--unofficial-foreground-alt,#404040)">
          Start free and scale as your team grows. Every plan includes the core workflow engine —
          upgrade when you need more power, capacity, or compliance.
        </p>

        {/* Billing toggle */}
        <div className="flex items-center gap-(--spacing-12) rounded-full border border-(--border,#e5e5e5) bg-[#fafafa] p-[4px]">
          <button
            onClick={() => setAnnual(false)}
            className={cn(
              "text-sm font-medium rounded-full px-(--spacing-16) py-(--spacing-8) leading-[20px] transition-colors",
              !annual ? "bg-white shadow-sm text-[#0a0a0a]" : "text-[#737373] hover:text-[#404040]",
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={cn(
              "text-sm font-medium flex items-center gap-(--spacing-8) rounded-full px-(--spacing-16) py-(--spacing-8) leading-[20px] transition-colors",
              annual ? "bg-white shadow-sm text-[#0a0a0a]" : "text-[#737373] hover:text-[#404040]",
            )}
          >
            Annual
            <span className="font-semibold rounded-full bg-[#dcfce7] px-[8px] py-[2px] text-[11px] leading-[16px] text-[#16a34a]">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="sm:grid-cols-2 lg:grid-cols-4 grid w-full max-w-[1188px] grid-cols-1 gap-[16px]">
        {plans.map((plan) => {
          const price = displayPrice(plan);
          const isDark = plan.popular;

          return (
            <div
              key={plan.slug}
              className={cn(
                "relative flex flex-col gap-(--spacing-32) rounded-[24px] border border-solid p-[32px]",
                isDark ? "border-[#0a0a0a] bg-[#0a0a0a]" : "border-[#e5e5e5] bg-[#fafafa]",
              )}
            >
              {plan.popular && (
                <span className="bg-white/10 font-semibold text-white absolute top-[20px] right-[20px] flex items-center gap-[4px] rounded-full px-[10px] py-[4px] text-[11px] leading-[16px]">
                  <Zap className="h-3 w-3" />
                  Most popular
                </span>
              )}

              {/* Plan header */}
              <div className="flex flex-col gap-(--spacing-12)">
                <p
                  className={cn(
                    "text-sm font-medium leading-[20px]",
                    isDark ? "text-white/60" : "text-[#737373]",
                  )}
                >
                  {plan.name}
                </p>

                <div className="flex items-end gap-[4px]">
                  {price === null ? (
                    <span
                      className={cn(
                        "text-4xl font-bold leading-none tracking-[-1.5px]",
                        isDark ? "text-white" : "text-[#0a0a0a]",
                      )}
                    >
                      Custom
                    </span>
                  ) : (
                    <>
                      <span
                        className={cn(
                          "text-4xl font-bold leading-none tracking-[-1.5px]",
                          isDark ? "text-white" : "text-[#0a0a0a]",
                        )}
                      >
                        ${price}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-normal mb-[4px] leading-[20px]",
                          isDark ? "text-white/50" : "text-[#a3a3a3]",
                        )}
                      >
                        / mo
                      </span>
                    </>
                  )}
                </div>

                {annual && price !== null && price !== 0 && (
                  <p
                    className={cn(
                      "text-[12px] leading-[16px]",
                      isDark ? "text-white/40" : "text-[#a3a3a3]",
                    )}
                  >
                    Billed ${price * 12}/yr
                  </p>
                )}

                <p
                  className={cn(
                    "text-sm leading-[20px]",
                    isDark ? "text-white/60" : "text-[#737373]",
                  )}
                >
                  {plan.description}
                </p>
              </div>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: isDark ? "secondary" : "default", size: "default" }),
                  "text-sm font-medium w-full justify-center rounded-full",
                  isDark && "bg-white hover:bg-white/90 text-[#0a0a0a]",
                )}
              >
                {plan.cta}
              </Link>

              {/* Feature list */}
              <ul className="flex flex-col gap-(--spacing-12)">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-(--spacing-8)">
                    <span
                      className={cn(
                        "text-[13px] leading-[20px]",
                        f.value === false
                          ? isDark
                            ? "text-white/25"
                            : "text-[#d4d4d4]"
                          : isDark
                            ? "text-white/70"
                            : "text-[#404040]",
                      )}
                    >
                      {f.label}
                    </span>
                    <FeatureValue value={f.value} dark={isDark} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Feature comparison table */}
      <div className="w-full max-w-[1188px] overflow-x-auto">
        <table className="text-sm w-full border-collapse">
          <thead>
            <tr>
              <th className="font-medium w-[30%] py-(--spacing-12) pr-(--spacing-20) text-left text-[13px] text-[#a3a3a3]">
                Feature
              </th>
              {plans.map((p) => (
                <th
                  key={p.slug}
                  className={cn(
                    "font-semibold px-(--spacing-12) py-(--spacing-12) text-center text-[13px]",
                    p.popular ? "text-[#0a0a0a]" : "text-[#737373]",
                  )}
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {featureGroups.map((group) => (
              <>
                <tr key={`group-${group.label}`}>
                  <td
                    colSpan={5}
                    className="font-semibold border-t border-[#f5f5f5] pt-(--spacing-20) pb-(--spacing-4) text-[11px] tracking-[0.08em] text-[#a3a3a3] uppercase"
                  >
                    {group.label}
                  </td>
                </tr>
                {group.keys.map((key) => (
                  <tr key={key} className="border-t border-[#f5f5f5]">
                    <td className="py-(--spacing-12) pr-(--spacing-20) text-[13px] text-[#404040]">
                      {key}
                    </td>
                    {plans.map((p) => {
                      const feat = p.features.find((f) => f.label === key);
                      return (
                        <td
                          key={p.slug}
                          className="px-(--spacing-12) py-(--spacing-12) text-center"
                        >
                          <div className="flex justify-center">
                            <FeatureValue value={feat?.value ?? false} />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enterprise note */}
      <p className="text-sm text-center leading-[20px] text-(--unofficial-foreground-alt,#404040)">
        Need volume discounts, on-premise deployment, or a custom contract?{" "}
        <Link
          href="https://cal.com/frumark/mirrroagents"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[#0a0a0a] underline underline-offset-2 transition-opacity hover:opacity-70"
        >
          Talk to our sales team.
        </Link>
      </p>
    </section>
  );
}
