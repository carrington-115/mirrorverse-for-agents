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
    <div className="flex flex-col gap-[var(--spacing-16)] w-full aspect-square border-[1px] border-[var(--border,#e5e5e5)] rounded-[var(--rounded-lg,8px)] overflow-hidden flex items-center justify-center p-[var(--spacing-12)]">
      <div className="w-full h-full bg-[var(--accent-0,#fafafa)] border-[1px] border-[var(--border,#e5e5e5)] rounded-[var(--rounded-xl,12px)] overflow-hidden flex items-center justify-center relative p-[var(--spacing-16)]">
        <Image
          src={imageSrc}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex flex-col gap-[var(--spacing-4)] items-start">
        <h4 className="font-semibold text-base leading-[24px] text-[var(--general-secondary-foreground,#171717)]">
          {title}
        </h4>
        <p className="font-normal text-xs leading-[16px] text-[var(--unofficial-foreground-alt,#404040)]">
          {description}
        </p>
      </div>
    </div>
  );
}
