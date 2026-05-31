import { PricingCard } from "@/components/pricing-card";

const plans = [
  {
    name: "Starter",
    price: "$0",
    description: "For individuals and small teams testing the waters.",
    features: [
      "1 active agent",
      "100 workflow runs / month",
      "2 integrations",
      "Email & chat support",
      "Basic analytics dashboard",
    ],
    ctaLabel: "Get started free",
    ctaHref: "#",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$79",
    description: "For growing teams ready to automate at scale.",
    features: [
      "10 active agents",
      "Unlimited workflow runs",
      "All 20+ integrations",
      "Priority support — 4h SLA",
      "Advanced analytics & monitoring",
      "Custom agent memory",
      "Audit logs",
      "Voice, SMS & WhatsApp channels",
    ],
    ctaLabel: "Start 14-day trial",
    ctaHref: "#",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For organizations that need scale, security, and dedicated support.",
    features: [
      "Unlimited agents",
      "Unlimited everything",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "SSO & SAML",
      "Custom integrations",
      "On-premise deployment option",
      "Compliance & audit reporting",
    ],
    ctaLabel: "Talk to sales",
    ctaHref: "https://cal.com/frumark/mirrroagents",
    highlighted: false,
  },
];

export function PricingPlans() {
  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-16 lg:px-[120px] lg:py-20 mx-auto max-w-[1188px]">
        <div className="gap-4 md:grid-cols-3 grid grid-cols-1">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
        <p className="mt-8 text-sm text-center text-[#737373]">
          /month billed annually · Monthly billing available at 20% more
        </p>
      </div>
    </section>
  );
}
