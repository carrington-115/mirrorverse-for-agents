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
        "p-8 lg:p-[40px] flex overflow-hidden rounded-[24px] border border-solid",
        isHorizontal
          ? "lg:flex-row gap-8 lg:gap-[64px] flex-col items-center"
          : "flex-col items-start gap-[32px] px-[32px] py-[48px]",
        containerClassName,
      )}
    >
      <div
        className={cn(
          "gap-2 flex w-full flex-col",
          isHorizontal ? "lg:w-[383px] w-full shrink-0" : "w-full",
          contentClassName,
        )}
      >
        <h3 className="font-semibold text-2xl leading-[28.8px] tracking-[-1px] text-[#0a0a0a]">
          {title}
        </h3>
        <p className="font-normal text-lg leading-[27px] text-[#404040]">{description}</p>
      </div>
      <div
        className={cn(
          "relative shrink-0 overflow-clip rounded-[24px] border-[3px] border-solid",
          isHorizontal ? "lg:w-full lg:h-[300px] w-full" : "w-full",
          imageContainerClassName,
        )}
      >
        <Image src={imageSrc} alt={title} className={cn("size-full", imageClassName)} />
      </div>
    </div>
  );
}
