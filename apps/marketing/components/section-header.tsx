import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-(--spacing-12)",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      <h2 className="font-medium md:text-[30px] lg:text-[36px] text-[28px] leading-[1.1] tracking-[-1px] text-(--general-secondary-foreground,#171717)">
        {title}
      </h2>
      {subtitle && (
        <p className="font-normal md:font-normal lg:text-[16px] w-full max-w-[600px] text-[16px] leading-[27px] text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}
