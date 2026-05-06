import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is mirrroverse?",
    answer:
      "mirrroverse is a unified AI platform that automates business processes across all departments—like sales, operations, HR, and finance—using intelligent superagents with shared memory to eliminate silos and boost efficiency 20x.",
  },
  {
    question: "How does mirrroverse differ from other AI tools?",
    answer:
      "Unlike siloed AI solutions, mirrroverse creates a single shared brain for your entire organization, enabling seamless multi-channel automation, real-time collaboration, and no-code workflows that scale to any department.",
  },
  {
    question: "Who is mirrroverse for?",
    answer:
      "mirrroverse is designed for growing businesses and teams in industries like e-commerce, healthcare, fintech, and professional services—anyone looking to automate repetitive tasks and unify operations without technical hurdles.",
  },
  {
    question: "How secure is mirrroverse?",
    answer:
      "mirrroverse prioritizes enterprise-grade security with encrypted data, role-based access, audit logs, and compliance tools like guardrails for PII, ensuring safe automation across sensitive processes.",
  },
  {
    question: "Can I integrate my existing tools with mirrroverse?",
    answer:
      "Yes, mirrroverse connects effortlessly with popular apps like Salesforce, Slack, Stripe, Calendly, and more, allowing your agents to pull data, trigger actions, and sync workflows in real time.",
  },
  {
    question: "How do I get started with mirrroverse?",
    answer:
      "Sign up for the waitlist to get early access, then use our no-code builder to create your first agent or workflow—start with templates for common tasks like order tracking or HR onboarding.",
  },
  {
    question: "What pricing options does mirrroverse offer?",
    answer:
      "mirrroverse starts with a free tier for basic testing, with paid plans scaling by usage, agents, and integrations—contact us for enterprise customizations.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faqs"
      className="mx-auto mt-[var(--spacing-160)] flex flex-col lg:flex-row w-full px-[var(--spacing-16)] lg:px-[var(--spacing-120)] gap-[var(--spacing-64)] lg:gap-[var(--spacing-120)] max-w-[1440px] items-start"
    >
      <div className="flex flex-col gap-[var(--spacing-20)] lg:gap-[var(--spacing-12)] w-full lg:w-[50%]">
        <h2 className="font-semibold text-3xl lg:text-[var(--heading-2-font-size)]/[var(--heading-2-line-height)] leading-[48px] tracking-[-1px] text-[var(--general-secondary-foreground,#171717)] lg:w-full lg:max-w-full max-w-[300px]">
          Frequently Asked Questions
        </h2>
        <p className="font-normal text-sm lg:text-base leading-[24px] text-[var(--unofficial-foreground-alt,#404040)] max-w-[340px]">
          Everything you need to know about mirrro. Can't find the answer you're
          looking for? Reach out to our support team.
        </p>
      </div>

      <div className="w-full lg:w-[60%] flex flex-col">
        <Accordion
          type="single"
          collapsible
          className="w-full flex flex-col gap-0 border-t border-[var(--border,#e5e5e5)]"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-[var(--border,#e5e5e5)] py-[var(--spacing-4)] px-0"
            >
              <AccordionTrigger className="text-left font-medium text-[15px] leading-[24px] text-[var(--general-secondary-foreground,#171717)] hover:no-underline hover:text-[var(--unofficial-foreground-alt,#404040)] transition-colors py-[var(--spacing-16)]">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="font-normal text-sm leading-[24px] text-[var(--unofficial-foreground-alt,#404040)] pb-[var(--spacing-16)] pr-[var(--spacing-32)]">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
