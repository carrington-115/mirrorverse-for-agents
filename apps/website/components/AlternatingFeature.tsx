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
        "flex flex-col lg:flex-row items-start gap-[var(--spacing-32)] lg:gap-[var(--spacing-64)] w-full lg:px-[var(--spacing-160)] px-[var(--spacing-16)] py-[var(--spacing-32)] lg:py-[var(--spacing-80)] justify-between overflow-clip",
        isImageLeft && "lg:flex-row-reverse",
        !isImageLeft && "bg-[var(--accent-0)]",
        containerClassName,
      )}
    >
      <div className="flex flex-col gap-[var(--spacing-16)] w-full lg:w-[30%] flex-shrink-0">
        <h3 className="font-semibold text-3xl lg:text-[40px] leading-[1.1] tracking-[-1px] text-[var(--general-foreground,#0a0a0a)]">
          {title}
        </h3>
        <p className="font-normal text-[var(--paragraph-large-font-size,18px)] leading-[var(--paragraph-large-line-height,27px)] text-[var(--unofficial-ghost-foreground,#404040)]">
          {description}
        </p>
      </div>

      <div className="w-[1000px] lg:w-[65%] flex justify-start items-start flex-shrink-0 bg-[var(--accent)] overflow-hidden pl-[var(--spacing-16)] py-[var(--spacing-32)] lg:px-[65px] lg:py-[50px]">
        <Image
          src={imageSrc}
          alt={title}
          className="w-full h-auto object-cover shadow-2xl"
        />
      </div>
    </div>
  );
}
