import { SectionHeader } from "@/components/section-header";

export function PricingHero() {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto max-w-[1188px] pt-[140px] text-center">
        <SectionHeader
          title="Simple, transparent pricing"
          subtitle="Start free and scale as you grow. No hidden fees, no surprises — just the tools your team needs."
        />
        <p className="mt-4 text-sm text-[#737373]">
          All plans include a 14-day free trial · No credit card required
        </p>
      </div>
    </section>
  );
}
