"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Headphones, TrendingUp, Users, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { cn } from "@/lib/utils";

// ── Scroll animation ────────────────────────────────────────────────────────

function AnimateCard({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout>;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => el.classList.add("is-visible"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, [delay]);

  return (
    <div ref={ref} className={cn("scroll-card", className)}>
      {children}
    </div>
  );
}

// ── Static data ─────────────────────────────────────────────────────────────

const useCases = [
  {
    icon: Headphones,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    category: "Customer Support",
    title: "Be there for every customer, around the clock",
    description:
      "Handle Tier 1 support tickets, answer FAQs, process returns, and escalate complex cases — automatically, across every channel.",
    outcomes: [
      "40% reduction in ticket volume",
      "24/7 coverage without added headcount",
      "< 30s first response time",
    ],
  },
  {
    icon: TrendingUp,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    category: "Sales",
    title: "Never let a warm lead go cold",
    description:
      "Qualify inbound leads, send personalized follow-ups, book discovery calls, and update your CRM — without lifting a finger.",
    outcomes: [
      "3× faster lead qualification",
      "60% more booked meetings",
      "Automatic CRM enrichment",
    ],
  },
  {
    icon: Users,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    category: "HR & Onboarding",
    title: "Onboard faster, retain better",
    description:
      "Automate new hire paperwork, answer policy questions, schedule orientations, and collect feedback — all through familiar channels.",
    outcomes: [
      "50% faster onboarding",
      "90% policy Q&amp;A deflection",
      "Consistent employee experience",
    ],
  },
  {
    icon: DollarSign,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    category: "Finance Operations",
    title: "Close your books, not your weekends",
    description:
      "Process expense requests, chase invoice approvals, send payment reminders, and generate reports — automatically.",
    outcomes: [
      "2× faster invoice processing",
      "80% fewer missed approvals",
      "Real-time spend visibility",
    ],
  },
];

// ── Use Cases preview section ────────────────────────────────────────────────

export function Features() {
  return (
    <section id="use-cases" className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <SectionHeader
          title="Built for teams that mean business"
          subtitle="From customer support to sales to HR — Mirrorverse has a workflow for every team."
        />

        <div className="mt-14 gap-4 md:grid-cols-2 grid grid-cols-1">
          {useCases.map((uc, i) => {
            const Icon = uc.icon;
            return (
              <AnimateCard key={uc.category} delay={i * 80}>
                <div className="group gap-5 p-7 hover:shadow-sm flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa] transition-shadow">
                  <div className="gap-3 flex items-center">
                    <div
                      className={`size-10 flex shrink-0 items-center justify-center rounded-xl ${uc.iconBg}`}
                    >
                      <Icon size={18} className={uc.iconColor} />
                    </div>
                    <span className="text-xs font-semibold text-[#737373]">{uc.category}</span>
                  </div>

                  <div className="gap-2 flex flex-col">
                    <h3 className="text-lg font-semibold leading-[1.25] tracking-[-0.3px] text-[#0a0a0a]">
                      {uc.title}
                    </h3>
                    <p className="text-sm leading-[22px] text-[#404040]">{uc.description}</p>
                  </div>

                  <ul className="gap-1.5 flex flex-col">
                    {uc.outcomes.map((outcome) => (
                      <li key={outcome} className="gap-2 text-xs flex items-center text-[#737373]">
                        <span className="size-1.5 bg-green-400 shrink-0 rounded-full" />
                        {outcome}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/use-cases"
                    className="gap-1.5 text-xs font-medium mt-auto flex items-center text-[#0a0a0a] transition-opacity hover:opacity-60"
                  >
                    See how it works
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </AnimateCard>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/use-cases"
            className="gap-2 bg-white px-6 py-3 text-sm font-medium inline-flex items-center rounded-full border border-[#e5e5e5] text-[#0a0a0a] transition-colors hover:bg-[#fafafa]"
          >
            View all use cases
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
