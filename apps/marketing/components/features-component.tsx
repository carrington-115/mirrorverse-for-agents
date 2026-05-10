import { featureDataProps } from "@/lib/types";
import Image from "next/image";

export default function Feature({ icon, title, description }: featureDataProps) {
  return (
    <>
      {/* For Mobile view */}
      {/* <section className="w-full flex justify-center px-[var(--spacing-20)] py-[var(--spacing-32)] bg-[var(--colors-black-5)] rounded-[var(--spacing-10)] border-[0.5px] border-[var(--colors-black-10)] h-[302px] lg:hidden md:hidden cursor-pointer dark:bg-[var(--colors-black-80)]">
        <div className="w-full flex flex-col items-end gap-[var(--spacing-12)]">
          <div className="w-full flex flex-col items-start px-[var(--spacing-10)] gap-[4px]">
            <h3 className="text-3xl font-bold dark:text-[var(--colors-black-5)]">
              {title}
            </h3>
            <p className="text-lg font-normal text-[var(--colors-black-70)] dark:text-[var(--colors-black-10)]">
              {description}
            </p>
          </div>
          <div className="flex items-center gap-[var(--spacing-10)]">
            <IconButton
              icon={<ChevronLeft fill={"white"} size={24} />}
              color="text-[var(--base-white)] dark:text-[var(--base-black)]"
              bgColor="bg-[var(--base-black)] dark:bg-[var(--colors-black-10)]"
            />

            <IconButton
              icon={<ChevronRight fill={"white"} size={24} />}
              color="text-[var(--base-white)] dark:text-[var(--base-black)]"
              bgColor="bg-[var(--base-black)] dark:bg-[var(--colors-black-10)]"
            />
          </div>
        </div>
      </section> */}

      {/* For Tablet and Desktop View */}
      <div className="md:flex lg:flex md:h-[200px] lg:px-[25px] lg:py-[45px] lg:min-h-[300px] flex h-[180px] cursor-pointer flex-col items-start justify-start gap-(--spacing-10) px-[24px] py-[30px]">
        <div className="flex flex-col items-start">
          <div>{icon && <Image src={icon} alt={title} />}</div>
          <h3 className="text-2xl font-bold text-(--colors-black-100) dark:text-(--colors-black-10)">
            {title}
          </h3>
        </div>
        <p className="text-lg font-normal text-(--colors-black-50) dark:text-(--colors-black-30)">
          {description}
        </p>
      </div>
    </>
  );
}
