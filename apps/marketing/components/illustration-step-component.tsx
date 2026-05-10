import Image, { StaticImageData } from "next/image";

interface IllustrationStepProps {
  title: string;
  description: string;
  imageSrc: StaticImageData | string;
}

export default function IllustrationStepComponent({
  title,
  description,
  imageSrc,
}: IllustrationStepProps) {
  return (
    <div className="flex aspect-square w-full flex-col items-center justify-center gap-(--spacing-16) overflow-hidden rounded-(--rounded-lg,8px) border border-(--border,#e5e5e5) p-(--spacing-12)">
      <div className="relative flex size-full items-center justify-center overflow-hidden rounded-(--rounded-xl,12px) border border-(--border,#e5e5e5) bg-(--accent-0,#fafafa) p-(--spacing-16)">
        <Image src={imageSrc} alt={title} className="size-full object-contain" />
      </div>

      <div className="flex flex-col items-start gap-(--spacing-4)">
        <h4 className="font-semibold text-base leading-[24px] text-(--general-secondary-foreground,#171717)">
          {title}
        </h4>
        <p className="font-normal text-xs leading-[16px] text-(--unofficial-foreground-alt,#404040)">
          {description}
        </p>
      </div>
    </div>
  );
}
