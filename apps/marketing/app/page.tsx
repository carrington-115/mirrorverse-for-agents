import { Hero, IntegrationsBar, Product, HowItWorks, Features, HomeFaq } from "@/sections/home";
import { CtaBanner } from "@/components/cta-banner";

export default function Home() {
  return (
    <>
      <Hero />
      <IntegrationsBar />
      <Product />
      <HowItWorks />
      <Features />
      <HomeFaq />
      <CtaBanner
        title="Start automating today — it's free"
        subtitle="Join thousands of teams using mirrorverse to eliminate busywork and scale without limits."
        primaryLabel="Try for free"
        primaryHref="#"
        secondaryLabel="Book a demo"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
    </>
  );
}
