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
      className="lg:flex-row lg:px-[var(--spacing-120)] lg:gap-[var(--spacing-120)] mx-auto mt-(--spacing-160) flex w-full max-w-[1440px] flex-col items-start gap-(--spacing-64) px-(--spacing-16)"
    >
      <div className="lg:gap-[var(--spacing-12)] lg:w-[50%] flex w-full flex-col gap-(--spacing-20)">
        <h2 className="font-semibold text-3xl lg:text-[var(--heading-2-font-size)]/[var(--heading-2-line-height)] lg:w-full lg:max-w-full max-w-[300px] leading-[48px] tracking-[-1px] text-(--general-secondary-foreground,#171717)">
          Frequently Asked Questions
        </h2>
        <p className="font-normal text-sm lg:text-base max-w-[340px] leading-[24px] text-(--unofficial-foreground-alt,#404040)">
          Everything you need to know about mirrro. Can&apos;t find the answer you&apos;re looking
          for? Reach out to our support team.
        </p>
      </div>

      <div className="lg:w-[60%] flex w-full flex-col">
        <Accordion
          type="single"
          collapsible
          className="gap-0 flex w-full flex-col border-t border-(--border,#e5e5e5)"
        >
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="px-0 border-b border-(--border,#e5e5e5) py-(--spacing-4)"
            >
              <AccordionTrigger className="font-medium py-(--spacing-16) text-left text-[15px] leading-[24px] text-(--general-secondary-foreground,#171717) transition-colors hover:text-(--unofficial-foreground-alt,#404040) hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="font-normal text-sm pr-(--spacing-32) pb-(--spacing-16) leading-[24px] text-(--unofficial-foreground-alt,#404040)">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
