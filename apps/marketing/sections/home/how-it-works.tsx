import { PenLine, PlugZap, Rocket, BarChart2 } from "lucide-react";
import { SectionHeader } from "@/components/section-header";

const steps = [
  {
    number: "01",
    icon: PenLine,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Describe your workflow",
    description:
      "Tell mirrorverse what you want to automate in plain language — no technical know-how required.",
  },
  {
    number: "02",
    icon: PlugZap,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Connect your tools",
    description:
      "Link your CRM, calendar, email, and 20+ other apps with a single click. Your stack, unified.",
  },
  {
    number: "03",
    icon: Rocket,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    title: "Deploy your agents",
    description:
      "Launch AI agents that execute your workflow across every channel — phone, chat, SMS, email.",
  },
  {
    number: "04",
    icon: BarChart2,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    title: "Monitor and optimize",
    description:
      "Track performance in real time and fine-tune with a single dashboard. Ship improvements fast.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <SectionHeader
          title="Simple to set up. Powerful at scale."
          subtitle="From zero to live automation in four steps — no engineers needed."
        />

        <div className="mt-14 gap-4 md:grid-cols-2 lg:grid-cols-4 grid grid-cols-1">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="gap-5 bg-white p-6 relative flex flex-col rounded-2xl border border-[#e5e5e5]"
              >
                {/* Step number */}
                <span className="text-xs font-semibold tracking-wider text-[#a3a3a3]">
                  {step.number}
                </span>
                {/* Icon */}
                <div
                  className={`size-11 flex items-center justify-center rounded-xl ${step.iconBg}`}
                >
                  <Icon size={20} className={step.iconColor} />
                </div>
                {/* Text */}
                <div className="gap-2 flex flex-col">
                  <h3 className="text-base font-semibold leading-snug text-[#0a0a0a]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-[22px] text-[#404040]">{step.description}</p>
                </div>
                {/* Connector arrow (all except last) */}
                {idx < steps.length - 1 && (
                  <div className="-right-2.5 lg:block absolute top-1/2 hidden -translate-y-1/2 text-[#e5e5e5]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M8 4l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
