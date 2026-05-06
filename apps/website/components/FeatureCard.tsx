import Image, { StaticImageData } from "next/image";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  imageSrc: StaticImageData | string;
  layout?: "horizontal" | "vertical";
  containerClassName?: string;
  imageContainerClassName?: string;
  imageClassName?: string;
  contentClassName?: string;
}

export default function FeatureCard({
  title,
  description,
  imageSrc,
  layout = "vertical",
  containerClassName = "",
  imageContainerClassName = "",
  imageClassName = "object-cover",
  contentClassName = "",
}: FeatureCardProps) {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={cn(
        "flex rounded-[24px] border border-solid p-8 lg:p-[40px] overflow-hidden",
        isHorizontal
          ? "flex-col lg:flex-row items-center gap-8 lg:gap-[64px]"
          : "flex-col gap-[32px] items-start px-[32px] py-[48px]",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-2 w-full",
          isHorizontal ? "w-full lg:w-[383px] flex-shrink-0" : "w-full",
          contentClassName,
        )}
      >
        <h3 className="font-semibold text-2xl leading-[28.8px] tracking-[-1px] text-[#0a0a0a]">
          {title}
        </h3>
        <p className="font-normal text-lg leading-[27px] text-[#404040]">
          {description}
        </p>
      </div>
      <div
        className={cn(
          "border-[3px] border-solid rounded-[24px] relative overflow-clip flex-shrink-0",
          isHorizontal ? "w-full lg:w-full lg:h-[300px]" : "w-full",
          imageContainerClassName,
        )}
      >
        <Image
          src={imageSrc}
          alt={title}
          className={cn("w-full h-full", imageClassName)}
        />
      </div>
    </div>
  );
}
