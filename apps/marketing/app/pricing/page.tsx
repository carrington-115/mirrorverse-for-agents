import { PricingHero, PricingPlans, PricingFaq } from "@/sections/pricing";
import { CtaBanner } from "@/components/cta-banner";
import { Footer } from "@/sections/footer";

export default function PricingPage() {
  return (
    <>
      <PricingHero />
      <PricingPlans />
      <PricingFaq />
      <CtaBanner
        title="Ready to automate your workflows?"
        subtitle="Start free today. No credit card required. Upgrade when you're ready."
        primaryLabel="Get started free"
        primaryHref="#"
        secondaryLabel="Talk to sales"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
      <Footer />
    </>
  );
}
