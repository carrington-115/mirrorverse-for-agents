import Image from "next/image";
import workflowImage from "@/assets/images/workflow.png";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { twMerge } from "tailwind-merge";

export default function HeroComponent() {
  return (
    <>
      <section className="md:pt-[175px] lg:pt-[200px] lg:gap-[var(--spacing-64)] lg:pb-[var(--spacing-64)] items-left lg:items-center relative container flex w-full flex-col gap-(--spacing-20) overflow-hidden bg-(--accent-0) px-(--spacing-16) pt-[110px] pb-(--spacing-80)">
        <div className="lg:w-auto items-left lg:items-center lg:gap-[var(--spacing-12)] flex w-[95%] max-w-[804px] flex-col gap-(--spacing-20)">
          <h1 className="md:text-[55px]/[70px] lg:text-[48px]/[48px] lg:text-center font-bold text-left text-[36px]/[40px] tracking-[-1.5px] text-(--general-foreground,#0a0a0a)">
            Supercharge your business with Agentic workflows
          </h1>
          <p className="lg:text-center lg:text-[18px]/[27px] max-w-[678px] text-left text-(length:--paragraph-mini-font-size) text-(--unofficial-ghost-foreground,#404040)">
            Empower every department with agents that think, adapt, and execute workflows
            intelligently, eliminating manual work and unlocking serious efficiency gains.
          </p>
          <div className="items-left lg:flex-row lg:items-center lg:justify-center lg:gap-[var(--spacing-12)] flex w-fit flex-col gap-(--spacing-20)">
            <Link
              href="https://cal.com/frumark/mirrroagents"
              className={twMerge(
                buttonVariants({
                  variant: "default",
                  size: "lg",
                }),
                "text-base font-medium rounded-full px-[12px] py-[6px] leading-[20px]",
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
                "text-base font-medium rounded-full px-[12px] py-[6px] leading-[20px]",
              )}
            >
              Discover features
            </Link>
          </div>
        </div>

        <div className="lg:w-full lg:max-w-[1188px] shadow-sm mt-[24px] w-[1000px] rounded-lg border-5 border-(--border)">
          <Image
            src={workflowImage}
            alt="Agentic workflows dashboard image"
            className="h-auto w-full rounded-lg object-cover"
          />
        </div>
      </section>
    </>
  );
}
