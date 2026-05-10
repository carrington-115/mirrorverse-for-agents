import Image, { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

interface AlternatingFeatureProps {
  title: string;
  description: string;
  imageSrc: StaticImageData | string;
  imagePosition?: "left" | "right";
  containerClassName?: string;
}

export default function AlternatingFeature({
  title,
  description,
  imageSrc,
  imagePosition = "right",
  containerClassName = "",
}: AlternatingFeatureProps) {
  const isImageLeft = imagePosition === "left";

  return (
    <div
      className={cn(
        "lg:flex-row lg:gap-[var(--spacing-64)] lg:px-[var(--spacing-160)] lg:py-[var(--spacing-80)] flex w-full flex-col items-start justify-between gap-(--spacing-32) overflow-clip px-(--spacing-16) py-(--spacing-32)",
        isImageLeft && "lg:flex-row-reverse",
        !isImageLeft && "bg-(--accent-0)",
        containerClassName,
      )}
    >
      <div className="lg:w-[30%] flex w-full shrink-0 flex-col gap-(--spacing-16)">
        <h3 className="font-semibold text-3xl lg:text-[40px] leading-[1.1] tracking-[-1px] text-(--general-foreground,#0a0a0a)">
          {title}
        </h3>
        <p className="font-normal text-(length:--paragraph-large-font-size,18px) leading-(--paragraph-large-line-height,27px) text-(--unofficial-ghost-foreground,#404040)">
          {description}
        </p>
      </div>

      <div className="lg:w-[65%] lg:px-[65px] lg:py-[50px] flex w-[1000px] shrink-0 items-start justify-start overflow-hidden bg-accent py-(--spacing-32) pl-(--spacing-16)">
        <Image src={imageSrc} alt={title} className="shadow-2xl h-auto w-full object-cover" />
      </div>
    </div>
  );
}
