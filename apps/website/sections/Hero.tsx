import { Button } from "@/components/ui/button";
import Image from "next/image";
import workflowImage from "@/assets/images/workflow.png";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";

export default function HeroComponent() {
  return (
    <>
      <section className="container relative w-full pt-[110px] md:pt-[175px] lg:pt-[200px] px-[var(--spacing-16)] gap-[var(--spacing-20)] lg:gap-[var(--spacing-64)] lg:pb-[var(--spacing-64)] flex flex-col items-left lg:items-center bg-[var(--accent-0)] overflow-hidden pb-[var(--spacing-80)]">
        <div className="w-[95%] lg:w-auto flex flex-col items-left lg:items-center max-w-[804px] gap-[var(--spacing-20)] lg:gap-[var(--spacing-12)]">
          <h1 className="text-[36px]/[40px] md:text-[55px]/[70px] lg:text-[48px]/[48px] text-left lg:text-center font-bold tracking-[-1.5px] text-[var(--general-foreground,#0a0a0a)]">
            Supercharge your business with Agentic workflows
          </h1>
          <p className="text-left lg:text-center text-[var(--paragraph-mini-font-size)] lg:text-[18px]/[27px] text-[var(--unofficial-ghost-foreground,#404040)] max-w-[678px]">
            Empower every department with agents that think, adapt, and execute
            workflows intelligently, eliminating manual work and unlocking
            serious efficiency gains.
          </p>
          <div className="w-fit flex flex-col items-left gap-[var(--spacing-20)] lg:flex-row lg:items-center lg:justify-center lg:gap-[var(--spacing-12)]">
            <Link
              href="https://cal.com/frumark/mirrroagents"
              className={twMerge(
                buttonVariants({
                  variant: "default",
                  size: "lg",
                }),
                "rounded-full px-[12px] py-[6px] text-base font-medium leading-[20px]",
              )}
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a call
            </Link>
            <Link
              href="#features"
              className={twMerge(
                buttonVariants({
                  variant: "outline",
                  size: "lg",
                }),
                "rounded-full px-[12px] py-[6px] text-base font-medium leading-[20px]",
              )}
            >
              Discover features
            </Link>
          </div>
        </div>

        <div className="mt-[24px] w-[1000px] lg:w-full lg:max-w-[1188px] rounded-lg border-5 border-[var(--border)] shadow-sm">
          <Image
            src={workflowImage}
            alt="Agentic workflows dashboard image"
            className="w-full h-auto object-cover rounded-lg"
          />
        </div>
      </section>
    </>
  );
}
