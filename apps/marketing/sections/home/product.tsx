import { Bot, Zap, CalendarDays, Search, FileText, BookOpen, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { cn } from "@/lib/utils";

const knowledgeBases = [
  {
    name: "Product Docs",
    count: "247 files",
    Icon: FileText,
    iconCls: "text-violet-600 bg-violet-50",
  },
  { name: "Support FAQ", count: "89 files", Icon: BookOpen, iconCls: "text-blue-600 bg-blue-50" },
  {
    name: "Legal Docs",
    count: "34 files",
    Icon: FileText,
    iconCls: "text-emerald-600 bg-emerald-50",
  },
];

export function Product() {
  return (
    <section id="product" className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <SectionHeader
          title="One platform, built to automate everything"
          subtitle="From AI-powered conversations to no-code workflow automation — mirrorverse gives every team the tools to work smarter."
        />

        <div className="mt-14 gap-4 flex flex-col">
          {/* ── Row 1: mirrorpilot agent — full width ───────────────────── */}
          <div className="gap-8 p-6 md:p-8 lg:flex-row lg:items-center lg:gap-12 lg:p-10 flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
            <div className="gap-4 lg:w-[42%] lg:shrink-0 flex flex-col">
              <span className="px-3 py-1 text-xs font-medium text-white w-fit rounded-full bg-[#0a0a0a]">
                mirrorpilot Agent
              </span>
              <h3 className="text-2xl font-semibold lg:text-3xl leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                Your always-on AI agent
              </h3>
              <p className="text-base leading-[26px] text-[#404040]">
                Deploy intelligent agents that handle customer conversations, qualify leads,
                schedule meetings, and resolve issues — across phone, chat, and email, 24/7.
              </p>
              <ul className="gap-2 flex flex-col">
                {[
                  "Natural language understanding",
                  "Multi-turn conversation memory",
                  "CRM integration (read + write)",
                  "Instant escalation to human agents",
                ].map((item) => (
                  <li key={item} className="gap-2 text-sm flex items-center text-[#404040]">
                    <span className="size-1.5 bg-green-500 shrink-0 rounded-full" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat mockup */}
            <div className="bg-white shadow-sm lg:flex-1 overflow-hidden rounded-2xl border border-[#e5e5e5]">
              {/* Header */}
              <div className="gap-2.5 px-4 py-3 flex items-center border-b border-[#e5e5e5] bg-[#fafafa]">
                <div className="size-7 flex shrink-0 items-center justify-center rounded-full bg-[#0a0a0a]">
                  <Bot size={13} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#0a0a0a]">mirrorpilot</p>
                  <p className="text-[10px] text-[#737373]">Customer Support</p>
                </div>
                <div className="gap-1.5 ml-auto flex items-center">
                  <span className="size-1.5 bg-green-400 rounded-full" />
                  <span className="text-[10px] text-[#737373]">Online</span>
                </div>
              </div>
              {/* Messages */}
              <div className="gap-2.5 p-4 flex flex-col">
                <div className="gap-2 flex items-end">
                  <div className="size-5 flex shrink-0 items-center justify-center rounded-full bg-[#0a0a0a]">
                    <Bot size={9} className="text-white" />
                  </div>
                  <div className="px-3 py-2 max-w-[78%] rounded-2xl rounded-bl-sm bg-[#f5f5f5]">
                    <p className="text-xs text-[#0a0a0a]">
                      Hi Sarah! Order #4821 is out for delivery — arriving today between 2–4 PM. 📦
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="px-3 py-2 max-w-[78%] rounded-2xl rounded-br-sm bg-[#0a0a0a]">
                    <p className="text-xs text-white">Can I change the delivery address?</p>
                  </div>
                </div>
                <div className="gap-2 flex items-end">
                  <div className="size-5 flex shrink-0 items-center justify-center rounded-full bg-[#0a0a0a]">
                    <Bot size={9} className="text-white" />
                  </div>
                  <div className="px-3 py-2 max-w-[78%] rounded-2xl rounded-bl-sm bg-[#f5f5f5]">
                    <p className="text-xs text-[#0a0a0a]">
                      Done! Address updated and confirmation sent to your email. ✓
                    </p>
                  </div>
                </div>
                {/* Typing indicator */}
                <div className="gap-2 flex items-end">
                  <div className="size-5 flex shrink-0 items-center justify-center rounded-full bg-[#0a0a0a]">
                    <Bot size={9} className="text-white" />
                  </div>
                  <div className="gap-1 px-3 py-3 flex items-center rounded-2xl rounded-bl-sm bg-[#f5f5f5]">
                    <span
                      className="size-1.5 animate-bounce rounded-full bg-[#a3a3a3]"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="size-1.5 animate-bounce rounded-full bg-[#a3a3a3]"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="size-1.5 animate-bounce rounded-full bg-[#a3a3a3]"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Row 2: Workflow + Memory ─────────────────────────────────── */}
          <div className="gap-4 lg:grid-cols-5 grid grid-cols-1">
            {/* Workflow builder — 3/5 */}
            <div className="gap-6 p-6 md:p-8 lg:col-span-3 flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
              <div className="gap-3 flex flex-col">
                <span className="bg-white px-3 py-1 text-xs font-medium w-fit rounded-full border border-[#e5e5e5] text-[#404040]">
                  Workflow Builder
                </span>
                <h3 className="text-xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                  Automate without writing a single line of code
                </h3>
                <p className="text-sm leading-[22px] text-[#404040]">
                  Drag, connect, deploy. Build complex multi-step automations that span your entire
                  tool stack in minutes.
                </p>
              </div>
              {/* Workflow diagram */}
              <div className="gap-2 flex flex-col">
                <div className="gap-2.5 bg-white p-3 flex items-center rounded-xl border border-[#e5e5e5]">
                  <div className="size-8 bg-amber-50 flex shrink-0 items-center justify-center rounded-lg">
                    <Zap size={14} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#0a0a0a]">New lead submitted</p>
                    <p className="text-[10px] text-[#737373]">Trigger · Webhook</p>
                  </div>
                  <span className="size-1.5 bg-green-400 ml-auto shrink-0 rounded-full" />
                </div>
                <div className="ml-6 h-4 w-px bg-[#e5e5e5]" />
                <div className="gap-2.5 p-3 flex items-center rounded-xl border border-[#171717] bg-[#0a0a0a]">
                  <div className="size-8 bg-white/10 flex shrink-0 items-center justify-center rounded-lg">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white">Qualify &amp; route lead</p>
                    <p className="text-white/50 text-[10px]">Agent · mirrorpilot</p>
                  </div>
                </div>
                <div className="ml-6 h-4 w-px bg-[#e5e5e5]" />
                <div className="gap-2.5 bg-white p-3 flex items-center rounded-xl border border-[#e5e5e5]">
                  <div className="size-8 bg-blue-50 flex shrink-0 items-center justify-center rounded-lg">
                    <CalendarDays size={14} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-[#0a0a0a]">Book discovery call</p>
                    <p className="text-[10px] text-[#737373]">Action · Calendly</p>
                  </div>
                  <span className="bg-green-50 px-2 py-0.5 font-medium text-green-600 ml-auto rounded-full text-[10px]">
                    Done
                  </span>
                </div>
              </div>
            </div>

            {/* Knowledge Bases — 2/5 */}
            <div className="gap-6 p-6 md:p-8 lg:col-span-2 flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
              <div className="gap-3 flex flex-col">
                <span className="bg-white px-3 py-1 text-xs font-medium w-fit rounded-full border border-[#e5e5e5] text-[#404040]">
                  Knowledge Bases
                </span>
                <h3 className="text-xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                  Your agents, grounded in your content
                </h3>
                <p className="text-sm leading-[22px] text-[#404040]">
                  Upload docs and FAQs. Agents retrieve the right information at the right moment —
                  no hallucinations.
                </p>
              </div>
              {/* KB list */}
              <div className="gap-2.5 flex flex-col">
                <div className="gap-2 bg-white px-3.5 py-2.5 flex items-center rounded-xl border border-[#e5e5e5]">
                  <Search size={13} className="shrink-0 text-[#a3a3a3]" />
                  <span className="text-sm text-[#a3a3a3]">Search knowledge bases…</span>
                </div>
                {knowledgeBases.map(({ name, count, Icon, iconCls }) => (
                  <div
                    key={name}
                    className="gap-3 bg-white px-3.5 py-3 flex items-center rounded-xl border border-[#e5e5e5]"
                  >
                    <div
                      className={cn(
                        "size-8 flex shrink-0 items-center justify-center rounded-lg",
                        iconCls,
                      )}
                    >
                      <Icon size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[#0a0a0a]">{name}</div>
                      <div className="text-[11px] text-[#737373]">{count}</div>
                    </div>
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
