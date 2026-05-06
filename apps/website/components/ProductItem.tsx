import Image from "next/image";
import Link from "next/link";
import { productLinkTypes } from "@/lib/types";

export default function ProductItem({
  productLink,
  image,
  title,
  description,
}: productLinkTypes) {
  return (
    <Link
      href={productLink}
      className="h-[276px] lg:h-[360px] w-[70%] md:w-full flex flex-col border-[0.7px] border-[var(--colors-black-10)] rounded-[var(--radius-xl)] hover:bg-[var(--colors-black-10)]/15 dark:hover:bg-[var(--colors-black-80)]/40 dark:border-[var(--colors-black-70)]"
    >
      <div className="h-[50%] lg:h-[50%] bg-[var(--colors-black-10)]/30 dark:bg-[var(--colors-black-80)]  flex items-center justify-center px-[var(--spacing-80)] py-[var(--spacing-20)] border-b border-b-[var(--colors-black-10)] rounded-t-[var(--radius-xl)] dark:border-b-[var(--colors-black-70)]">
        <div className="w-[170px] lg:w-[152px] md:w-[180px] h-auto">
          <Image src={image} alt={title} className="w-full h-full" />
        </div>
      </div>
      <div className="flex flex-col mx-[15px] my-[18px]">
        <h2 className="text-2xl lg:text-[28px] font-semibold">{title}</h2>
        <p className="text-sm lg:text-base text-[var(--colors-black-50)] dark:text-[var(--colors-black-15)]">
          {description}
        </p>
      </div>
    </Link>
  );
}
