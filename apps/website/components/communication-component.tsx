import { simpleComType } from "@/lib/types";
import Image from "next/image";

export default function CommunicationComponent({ icon, title }: simpleComType) {
  return (
    <>
      <div className="md:gap-[5px] md:w-[120px] flex h-[130px] w-[150px] flex-col items-center justify-center gap-[8px] rounded-[8px] border-[0.5px] border-(--colors-black-15) bg-(--colors-black-15)/20 p-(--spacing-10) px-[5px] dark:border-(--colors-black-50) dark:bg-(--colors-black-80)">
        <div className="size-[48px]">
          <Image src={icon} alt={title} className="size-full" />
        </div>
        <p className="text-base text-center">{title}</p>
      </div>
    </>
  );
}
