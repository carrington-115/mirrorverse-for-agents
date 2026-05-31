import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--spacing-24) rounded-[24px] border p-(--spacing-32)",
        highlighted
          ? "text-white border-transparent bg-(--general-secondary-foreground,#171717)"
          : "bg-white border-(--border,#e5e5e5)",
      )}
    >
      <div className="flex flex-col gap-(--spacing-8)">
        <p
          className={cn(
            "text-sm font-semibold leading-[20px]",
            highlighted ? "text-(--colors-black-20)" : "text-(--unofficial-foreground-alt,#404040)",
          )}
        >
          {name}
        </p>
        <p
          className={cn(
            "font-bold text-[40px] leading-[1] tracking-[-1px]",
            highlighted ? "text-white" : "text-(--general-secondary-foreground,#171717)",
          )}
        >
          {price}
        </p>
        <p
          className={cn(
            "text-sm leading-[20px]",
            highlighted ? "text-(--colors-black-20)" : "text-(--unofficial-foreground-alt,#404040)",
          )}
        >
          {description}
        </p>
      </div>

      <Link
        href={ctaHref}
        className={cn(
          buttonVariants({ variant: highlighted ? "outline" : "default", size: "default" }),
          "font-medium w-full justify-center",
          highlighted && "border-white text-white hover:bg-white/10",
        )}
      >
        {ctaLabel}
      </Link>

      <ul className="flex flex-col gap-(--spacing-12)">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-(--spacing-8)">
            <Check
              size={16}
              className={cn(
                "mt-[2px] shrink-0",
                highlighted ? "text-(--colors-black-20)" : "text-(--colors-primary)",
              )}
            />
            <span
              className={cn(
                "text-sm leading-[20px]",
                highlighted
                  ? "text-(--colors-black-10)"
                  : "text-(--unofficial-foreground-alt,#404040)",
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
