import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
}

interface AccordionFaqProps {
  items: FaqItem[];
}

export function AccordionFaq({ items }: AccordionFaqProps) {
  return (
    <Accordion
      type="single"
      collapsible
      className="flex w-full flex-col border-t border-(--border,#e5e5e5)"
    >
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="px-0 border-b border-(--border,#e5e5e5) py-(--spacing-4)"
        >
          <AccordionTrigger className="font-medium py-(--spacing-16) text-left text-[15px] leading-[24px] text-(--general-secondary-foreground,#171717) transition-colors hover:text-(--unofficial-foreground-alt,#404040) hover:no-underline">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm font-normal pr-(--spacing-32) pb-(--spacing-16) leading-[24px] text-(--unofficial-foreground-alt,#404040)">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
