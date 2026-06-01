"use client";

import { useState } from "react";
import { PricingCard } from "@/components/pricing-card";

const plans = [
  {
    slug: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Explore the platform — no card required.",
    features: ["5 workflow generations / mo", "100 runs / mo", "1 app", "Community support"],
    ctaLabel: "Get started free",
    ctaHref: "https://app.mirrorverse.ai/sign-up",
    highlighted: false,
    badge: undefined,
  },
  {
    slug: "starter",
    name: "Starter",
    monthlyPrice: 49,
    annualPrice: 39,
    description: "For small teams automating their first workflows.",
    features: [
      "50 generations / mo",
      "2,000 runs / mo",
      "5 apps",
      "1 phone number",
      "Email support",
    ],
    ctaLabel: "Start free trial",
    ctaHref: "https://app.mirrorverse.ai/sign-up",
    highlighted: false,
    badge: undefined,
  },
  {
    slug: "pro",
    name: "Pro",
    monthlyPrice: 149,
    annualPrice: 119,
    description: "For growing teams with advanced needs.",
    features: [
      "Unlimited generations",
      "20,000 runs / mo",
      "Unlimited apps",
      "5 phone numbers",
      "All models incl. Opus",
      "SSO / SAML",
      "Priority support",
    ],
    ctaLabel: "Start free trial",
    ctaHref: "https://app.mirrorverse.ai/sign-up",
    highlighted: true,
    badge: "Most popular",
  },
  {
    slug: "custom",
    name: "Custom",
    monthlyPrice: null,
    annualPrice: null,
    description: "Dedicated infrastructure and custom SLAs.",
    features: [
      "Everything in Pro",
      "Unlimited phone numbers",
      "Fine-tuned models",
      "Custom data retention",
      "Dedicated account manager",
    ],
    ctaLabel: "Talk to sales",
    ctaHref: "https://cal.com/frumark/mirrroagents",
    highlighted: false,
    badge: undefined,
  },
] as const;

export function PricingPlans() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-16 lg:px-[120px] lg:py-20 mx-auto max-w-[1188px]">
        <div className="mb-8 gap-3 flex items-center justify-center">
          <span
            className={`text-sm font-medium ${!isAnnual ? "text-[#171717]" : "text-[#737373]"}`}
          >
            Monthly
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={isAnnual}
            onClick={() => setIsAnnual((prev) => !prev)}
            className={`h-6 w-11 relative shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
              isAnnual ? "bg-[#171717]" : "bg-[#e5e5e5]"
            }`}
          >
            <span
              className={`h-5 w-5 bg-white shadow-lg pointer-events-none block rounded-full ring-0 transition-transform ${
                isAnnual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span
            className={`gap-2 text-sm font-medium flex items-center ${isAnnual ? "text-[#171717]" : "text-[#737373]"}`}
          >
            Annual
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full">
              Save 20%
            </span>
          </span>
        </div>

        <div className="gap-4 sm:grid-cols-2 lg:grid-cols-4 grid grid-cols-1">
          {plans.map((plan) => (
            <PricingCard
              key={plan.slug}
              name={plan.name}
              monthlyPrice={plan.monthlyPrice}
              annualPrice={plan.annualPrice}
              isAnnual={isAnnual}
              badge={plan.badge}
              description={plan.description}
              features={[...plan.features]}
              ctaLabel={plan.ctaLabel}
              ctaHref={plan.ctaHref}
              highlighted={plan.highlighted}
            />
          ))}
        </div>

        <p className="mt-8 text-sm text-center text-[#737373]">
          Annual plans billed upfront · Monthly billing available at 20% more
        </p>
      </div>
    </section>
  );
}
