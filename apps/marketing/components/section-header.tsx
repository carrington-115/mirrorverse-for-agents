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
      <h2 className="font-semibold text-2xl sm:text-3xl lg:text-[40px] leading-[1.1] tracking-[-1px] text-(--general-secondary-foreground,#171717)">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm sm:text-base sm:leading-[27px] lg:text-lg w-full max-w-[600px] leading-[24px] text-(--unofficial-foreground-alt,#404040)">
          {subtitle}
        </p>
      )}
    </div>
  );
}
