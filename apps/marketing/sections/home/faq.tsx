import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { AccordionFaq } from "@/components/accordion-faq";

const homeFaqs = [
  {
    question: "What is mirrorverse?",
    answer:
      "mirrorverse is a unified AI platform that automates business workflows across every channel — from customer support and sales to HR and finance — using intelligent agents with shared memory. One platform, every department.",
  },
  {
    question: "Do I need technical skills to use mirrorverse?",
    answer:
      "Not at all. mirrorverse is built for business teams. Our no-code workflow builder lets you create and deploy agents without writing a single line of code. If you can describe a process, you can automate it.",
  },
  {
    question: "How does mirrorverse differ from a traditional chatbot?",
    answer:
      "Traditional chatbots follow rigid scripts and break the moment something unexpected happens. mirrorverse agents think, adapt, and act — they can call APIs, access your CRM, book meetings, send follow-ups, and make context-aware decisions mid-conversation.",
  },
  {
    question: "What channels does mirrorverse support?",
    answer:
      "Phone (inbound and outbound), SMS, Telegram, email, and live chat. All channels share the same agent context and memory, so every conversation picks up exactly where the last one left off — regardless of channel.",
  },
  {
    question: "How is my data protected?",
    answer:
      "We use end-to-end encryption, role-based access controls, comprehensive audit logs, and SOC 2-aligned practices. Your data is never used to train our models. Enterprise customers can request on-premise deployment.",
  },
  {
    question: "Can I try mirrorverse for free?",
    answer:
      "Yes. Our Starter plan is free forever — no credit card required. You can create your first agent and run up to 100 workflow automations per month. Upgrade when you&apos;re ready to scale.",
  },
];

export function HomeFaq() {
  return (
    <section id="faqs" className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <div className="gap-12 lg:flex-row lg:gap-20 flex flex-col">
          {/* Left: header + contact link */}
          <div className="gap-6 lg:w-[40%] lg:shrink-0 flex flex-col">
            <SectionHeader
              title="Questions we get a lot"
              subtitle="Everything you need to know about mirrorverse. Can't find the answer? Our team is one message away."
              align="left"
            />
            <Link
              href="https://cal.com/frumark/mirrroagents"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium w-fit text-[#0a0a0a] underline underline-offset-4 hover:text-[#404040]"
            >
              Talk to our team →
            </Link>
          </div>
          {/* Right: accordion */}
          <div className="lg:flex-1">
            <AccordionFaq items={homeFaqs} />
          </div>
        </div>
      </div>
    </section>
  );
}
