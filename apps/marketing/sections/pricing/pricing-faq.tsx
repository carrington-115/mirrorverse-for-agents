import { SectionHeader } from "@/components/section-header";
import { AccordionFaq } from "@/components/accordion-faq";

const pricingFaqs = [
  {
    question: "Is there a free trial for paid plans?",
    answer:
      "Yes — every paid plan starts with a 14-day free trial, no credit card required. If mirrorverse isn&apos;t the right fit, cancel before the trial ends and you won&apos;t be charged a thing.",
  },
  {
    question: "Can I change or cancel my plan at any time?",
    answer:
      "Absolutely. Upgrade, downgrade, or cancel at any time from your account settings. Cancellations take effect at the end of your current billing period — no prorated charges, no lock-in.",
  },
  {
    question: "How does billing work for annual plans?",
    answer:
      "Annual plans are billed upfront for 12 months and save you 20% compared to monthly billing. You&apos;ll receive an invoice at the start of each cycle. We accept all major credit cards and ACH bank transfers.",
  },
  {
    question: "Do you offer discounts for nonprofits or startups?",
    answer:
      "Yes — qualifying nonprofits and early-stage startups (under $1M ARR) receive 50% off any paid plan. Reach out to our team to apply. We review applications within 2 business days.",
  },
  {
    question: "What happens when I exceed my plan&apos;s limits?",
    answer:
      "On the Starter plan, automations pause at the monthly limit and resume on the next cycle. On paid plans, we&apos;ll notify you before you hit any limit — never a hard cutoff that breaks live workflows.",
  },
];

export function PricingFaq() {
  return (
    <section className="bg-[#fafafa]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <div className="gap-12 lg:flex-row lg:gap-20 flex flex-col">
          <div className="gap-4 lg:w-[38%] lg:shrink-0 flex flex-col">
            <SectionHeader
              title="Pricing questions, answered"
              subtitle="Still unsure? Book a free call with our team — we'll help you find the right plan."
              align="left"
            />
          </div>
          <div className="lg:flex-1">
            <AccordionFaq items={pricingFaqs} />
          </div>
        </div>
      </div>
    </section>
  );
}
