import { communicationTypes, simpleComType } from "@/lib/types";
import Image from "next/image";

export default function CommunicationComponent({ icon, title }: simpleComType) {
  return (
    <>
      <div className="flex flex-col items-center justify-center p-[var(--spacing-10)] px-[5px] gap-[8px] md:gap-[5px] bg-[var(--colors-black-15)]/20 dark:bg-[var(--colors-black-80)] rounded-[8px] border-[0.5px] border-[var(--colors-black-15)] dark:border-[var(--colors-black-50)] h-[130px] w-[150px] md:w-[120px]">
        <div className="w-[48px] h-[48px]">
          <Image src={icon} alt={title} className="w-full h-full" />
        </div>
        <p className="text-center text-base">{title}</p>
      </div>
    </>
  );
}
