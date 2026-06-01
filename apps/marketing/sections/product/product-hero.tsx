import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/section-header";

export function ProductHero() {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="gap-10 px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto flex max-w-[1188px] flex-col items-center pt-[140px] text-center">
        <SectionHeader
          title="The AI platform teams actually use"
          subtitle="Build, deploy, and manage intelligent agents that automate your most important workflows — from customer support to sales operations."
        />
        <div className="gap-3 flex flex-wrap items-center justify-center">
          <Link
            href="#"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "px-6 text-base font-normal md:text-base md:font-medium h-[45px] rounded-full",
            )}
          >
            Try for free
          </Link>
          <Link
            href="https://cal.com/frumark/mirrroagents"
            className="px-6 text-base font-normal md:text-base md:font-medium shadow-sm hover:bg-black/5 flex h-[45px] items-center justify-center rounded-full border border-[#a3a3a3] bg-transparent text-[#0a0a0a] transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            Book a demo
          </Link>
        </div>

        {/* Dashboard preview mockup */}
        <div className="bg-white shadow-sm w-full max-w-[960px] overflow-hidden rounded-2xl border border-[#e5e5e5]">
          {/* Window chrome */}
          <div className="gap-1.5 px-4 py-3 flex items-center border-b border-[#e5e5e5] bg-[#fafafa]">
            <span className="size-2.5 bg-red-400 rounded-full" />
            <span className="size-2.5 bg-amber-400 rounded-full" />
            <span className="size-2.5 bg-green-400 rounded-full" />
            <span className="text-xs mx-auto text-[#737373]">mirrorverse · Dashboard</span>
          </div>
          {/* Simplified dashboard layout */}
          <div className="flex h-[320px] divide-x divide-[#e5e5e5]">
            {/* Sidebar */}
            <div className="w-48 gap-1 p-3 flex flex-col bg-[#fafafa]">
              {[
                "Mirrorpilot",
                "Workflows",
                "Knowledge",
                "Channels",
                "Integrations",
                "Settings",
              ].map((item, i) => (
                <div
                  key={item}
                  className={`px-3 py-2 text-xs font-medium rounded-lg ${i === 0 ? "text-white bg-[#0a0a0a]" : "text-[#737373]"}`}
                >
                  {item}
                </div>
              ))}
            </div>
            {/* Main content */}
            <div className="gap-4 p-5 flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0a0a0a]">Active Agents</span>
                <span className="bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700 rounded-full">
                  3 online
                </span>
              </div>
              <div className="gap-2 flex flex-col">
                {[
                  {
                    name: "Support Agent",
                    channel: "Phone + Chat",
                    status: "Handling 4 conversations",
                  },
                  {
                    name: "Sales Agent",
                    channel: "Email + SMS",
                    status: "Qualified 12 leads today",
                  },
                  { name: "HR Bot", channel: "Slack", status: "Answered 7 policy questions" },
                ].map((agent) => (
                  <div
                    key={agent.name}
                    className="px-4 py-3 flex items-center justify-between rounded-xl border border-[#e5e5e5] bg-[#fafafa]"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#0a0a0a]">{agent.name}</p>
                      <p className="text-[10px] text-[#737373]">{agent.channel}</p>
                    </div>
                    <span className="text-[10px] text-[#737373]">{agent.status}</span>
                    <span className="size-1.5 bg-green-400 rounded-full" />
                  </div>
                ))}
              </div>
              {/* Mini chart */}
              <div className="gap-1 h-16 px-4 py-3 mt-auto flex items-end rounded-xl border border-[#e5e5e5] bg-[#fafafa]">
                {[40, 65, 45, 80, 60, 90, 75, 85, 70, 95, 88, 100].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-sm bg-[#0a0a0a]/10"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
