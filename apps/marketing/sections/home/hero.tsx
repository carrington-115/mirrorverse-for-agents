import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="gap-10 px-5 pb-16 lg:pt-[160px] md:gap-16 md:pb-20 md:pt-[140px] mx-auto flex max-w-[1188px] flex-col items-center pt-[100px]">
        {/* ── Headline + subtext + CTAs ───────────────────────────────────── */}
        <div className="gap-4 flex max-w-[822px] flex-col items-center text-center">
          <h1
            className="animate-fade-in-up font-semibold sm:tracking-[-1.5px] md:text-[48px] lg:text-[56px] lg:tracking-[-2px] mt-8 md:mt-0 md:text-center text-left text-[36px] leading-[1.05] tracking-[-1px] text-[#0a0a0a]"
            style={{
              animationDelay: "0ms",
            }}
          >
            Stop baby sitting workflows and increase productivity
          </h1>

          <p
            className="animate-fade-in-up text-base font-medium lg:text-[18px] text-xl font-normal md:font-normal md:text-center max-w-[500px] text-left leading-[27px] text-muted-foreground"
            style={{ animationDelay: "100ms" }}
          >
            The busywork that&apos;s slowing your team down? Hand it to AI agents that just get it
            done.
          </p>

          <div
            className="animate-fade-in-up mt-1 gap-3 mt-8 md:mt-0 md:justify-center flex w-full items-stretch"
            style={{ animationDelay: "200ms" }}
          >
            <Link
              href="https://work.mirrro.io"
              className={cn(
                buttonVariants({ variant: "default", size: "default" }),
                "md:w-auto md:px-6 text-lg font-normal md:text-base md:font-medium h-[49px] w-1/2 rounded-full",
              )}
            >
              Try for free
            </Link>
            <Link
              href="https://cal.com/frumark/mirrroagents"
              className="md:w-auto md:px-6 text-lg md:text-base font-medium hover:bg-black/5 flex h-[49px] w-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-transparent text-[#0a0a0a] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
