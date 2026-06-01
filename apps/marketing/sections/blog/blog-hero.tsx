import { SectionHeader } from "@/components/section-header";

export function BlogHero() {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto max-w-[1188px] pt-[140px] text-center">
        <SectionHeader
          title="Blog"
          subtitle="Insights, use cases, and company updates from the Mirrorverse team."
        />
      </div>
    </section>
  );
}
