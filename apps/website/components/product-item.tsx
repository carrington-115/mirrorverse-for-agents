import Image from "next/image";
import Link from "next/link";
import { productLinkTypes } from "@/lib/types";

export default function ProductItem({ productLink, image, title, description }: productLinkTypes) {
  return (
    <Link
      href={productLink}
      className="lg:h-[360px] md:w-full flex h-[276px] w-[70%] flex-col rounded-xl border-[0.7px] border-(--colors-black-10) hover:bg-(--colors-black-10)/15 dark:border-(--colors-black-70) dark:hover:bg-(--colors-black-80)/40"
    >
      <div className="lg:h-[50%] flex h-[50%] items-center justify-center rounded-t-xl border-b border-b-(--colors-black-10) bg-(--colors-black-10)/30 px-(--spacing-80) py-(--spacing-20) dark:border-b-(--colors-black-70) dark:bg-(--colors-black-80)">
        <div className="lg:w-[152px] md:w-[180px] h-auto w-[170px]">
          <Image src={image} alt={title} className="size-full" />
        </div>
      </div>
      <div className="mx-[15px] my-[18px] flex flex-col">
        <h2 className="text-2xl lg:text-[28px] font-semibold">{title}</h2>
        <p className="text-sm lg:text-base text-(--colors-black-50) dark:text-(--colors-black-15)">
          {description}
        </p>
      </div>
    </Link>
  );
}
