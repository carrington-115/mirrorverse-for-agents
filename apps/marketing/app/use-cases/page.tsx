import { UseCasesHero, UseCasesGrid } from "@/sections/use-cases";
import { CtaBanner } from "@/components/cta-banner";
import { Footer } from "@/sections/footer";

export default function UseCasesPage() {
  return (
    <>
      <UseCasesHero />
      <UseCasesGrid />
      <CtaBanner
        title="Find your workflow in minutes"
        subtitle="Tell us what you're trying to automate and we'll build it with you — live."
        primaryLabel="Try for free"
        primaryHref="#"
        secondaryLabel="Book a demo"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
      <Footer />
    </>
  );
}
