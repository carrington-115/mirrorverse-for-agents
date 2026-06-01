import { PricingHero, PricingPlans, PricingCompare, PricingFaq } from "@/sections/pricing";
import { CtaBanner } from "@/components/cta-banner";

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingPlans />
      <PricingCompare />
      <PricingFaq />
      <CtaBanner
        title="Ready to automate your workflows?"
        subtitle="Start free today. No credit card required. Upgrade when you're ready."
        primaryLabel="Get started free"
        primaryHref="https://app.mirrorverse.ai/sign-up"
        secondaryLabel="Talk to sales"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
    </>
  );
}
