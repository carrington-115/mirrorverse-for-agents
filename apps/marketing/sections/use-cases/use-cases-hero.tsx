import { SectionHeader } from "@/components/section-header";

export function UseCasesHero() {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto max-w-[1188px] pt-[140px] text-center">
        <SectionHeader
          title="Built for teams that mean business"
          subtitle="Whether you're in customer support, sales, HR, or finance — mirrorverse has a workflow for you. See how leading teams automate the work that matters."
        />
      </div>
    </section>
  );
}
