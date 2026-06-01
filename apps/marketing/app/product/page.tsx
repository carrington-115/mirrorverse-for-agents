import { ProductHero, ProductFeatures } from "@/sections/product";
import { CtaBanner } from "@/components/cta-banner";

export default function ProductPage() {
  return (
    <>
      <ProductHero />
      <ProductFeatures />
      <CtaBanner
        title="See mirrorverse in action"
        subtitle="Get a personalized walkthrough of the features that matter most for your team."
        primaryLabel="Try for free"
        primaryHref="#"
        secondaryLabel="Book a demo"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
    </>
  );
}
