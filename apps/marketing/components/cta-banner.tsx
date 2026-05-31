import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface CtaBannerProps {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export function CtaBanner({
  title,
  subtitle,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: CtaBannerProps) {
  return (
    <section className="lg:px-[120px] flex w-full justify-center border-t border-(--border,#e5e5e5) bg-(--accent-0,#fafafa) px-(--spacing-16) py-(--spacing-80)">
      <div className="flex max-w-[640px] flex-col items-center gap-(--spacing-20) text-center">
        <h2 className="font-semibold text-3xl lg:text-[40px] leading-[1.1] tracking-[-1px] text-(--general-secondary-foreground,#171717)">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base lg:text-lg leading-[27px] text-(--unofficial-foreground-alt,#404040)">
            {subtitle}
          </p>
        )}
        <div className="sm:w-auto sm:flex-row sm:items-center flex w-full flex-col items-stretch gap-(--spacing-12)">
          <Link
            href={primaryHref}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "font-medium rounded-full",
            )}
          >
            {primaryLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "font-medium rounded-full",
              )}
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
