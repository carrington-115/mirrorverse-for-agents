import { SectionHeader } from "@/components/section-header";
import { AccordionFaq } from "@/components/accordion-faq";
import type { BlogFaq } from "@/lib/blog-types";

interface BlogPostFaqsProps {
  faqs: BlogFaq[];
}

export function BlogPostFaqs({ faqs }: BlogPostFaqsProps) {
  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <div className="gap-12 lg:flex-row lg:gap-20 flex flex-col">
          <div className="lg:w-[40%] lg:shrink-0">
            <SectionHeader
              title="Frequently asked questions"
              subtitle="Common questions about this topic answered by the Mirrorverse team."
              align="left"
            />
          </div>
          <div className="lg:flex-1">
            <AccordionFaq items={faqs} />
          </div>
        </div>
      </div>
    </section>
  );
}
