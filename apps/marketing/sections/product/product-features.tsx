import { Bot, GitBranch, Brain, BarChart2, Check } from "lucide-react";

const features = [
  {
    tag: "mirrorpilot Agent",
    icon: Bot,
    iconBg: "bg-[#0a0a0a]",
    iconColor: "text-white",
    title: "Talk to your customers. Handle the work.",
    description:
      "Your AI-powered agent holds real conversations, answers questions, books meetings, and resolves issues autonomously — across phone, chat, and email.",
    points: [
      "Natural language understanding",
      "Multi-turn conversation memory",
      "CRM integration (read + write)",
      "Escalation to human agents",
    ],
    imagePosition: "right" as const,
    visual: "chat" as const,
    bg: "bg-white",
  },
  {
    tag: "Workflow Builder",
    icon: GitBranch,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-600",
    title: "Describe it. Connect it. Ship it.",
    description:
      "A no-code canvas where you compose powerful automation flows by connecting triggers, conditions, actions, and agents — without writing a line of code.",
    points: [
      "Drag-and-drop interface",
      "20+ pre-built action blocks",
      "Conditional logic & branching",
      "Scheduled and event-based triggers",
    ],
    imagePosition: "left" as const,
    visual: "workflow" as const,
    bg: "bg-[#fafafa]",
  },
  {
    tag: "Shared Memory",
    icon: Brain,
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
    title: "No context ever gets dropped.",
    description:
      "One unified memory layer shared across all your agents and channels. Every interaction, data point, and decision is accessible in real time.",
    points: [
      "Cross-channel context persistence",
      "Automatic knowledge extraction",
      "Custom memory schemas",
      "GDPR-compliant data handling",
    ],
    imagePosition: "right" as const,
    visual: "memory" as const,
    bg: "bg-white",
  },
  {
    tag: "Monitoring",
    icon: BarChart2,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    title: "See everything that matters.",
    description:
      "A live dashboard that surfaces what your agents are doing, where they&apos;re succeeding, and where they need tuning.",
    points: [
      "Real-time agent activity feed",
      "Conversation analytics",
      "Workflow performance metrics",
      "Alert & notification system",
    ],
    imagePosition: "left" as const,
    visual: "analytics" as const,
    bg: "bg-[#fafafa]",
  },
];

function ChatVisual() {
  return (
    <div className="bg-white shadow-sm overflow-hidden rounded-2xl border border-[#e5e5e5]">
      <div className="gap-2 px-4 py-3 flex items-center border-b border-[#e5e5e5] bg-[#fafafa]">
        <div className="size-6 flex items-center justify-center rounded-full bg-[#0a0a0a]">
          <Bot size={11} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-[#0a0a0a]">Support Agent</span>
        <span className="size-1.5 bg-green-400 ml-auto rounded-full" />
      </div>
      <div className="gap-2.5 p-4 flex flex-col">
        {[
          {
            type: "agent",
            text: "Hi! I see your subscription renews in 3 days. Can I help with anything?",
          },
          { type: "user", text: "I&apos;d like to switch to annual billing." },
          {
            type: "agent",
            text: "Done! Switched to annual — saves you $180/year. Confirmation sent to your email. ✓",
          },
        ].map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.type === "user" ? "justify-end" : "gap-2 items-end"}`}
          >
            {msg.type === "agent" && (
              <div className="size-5 flex shrink-0 items-center justify-center rounded-full bg-[#0a0a0a]">
                <Bot size={9} className="text-white" />
              </div>
            )}
            <div
              className={`px-3 py-2 text-xs max-w-[78%] rounded-2xl ${
                msg.type === "user"
                  ? "text-white rounded-br-sm bg-[#0a0a0a]"
                  : "rounded-bl-sm bg-[#f5f5f5] text-[#0a0a0a]"
              }`}
              dangerouslySetInnerHTML={{ __html: msg.text }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkflowVisual() {
  const nodes = [
    {
      label: "Customer emails support",
      sub: "Trigger · Gmail",
      dark: false,
      accent: "bg-amber-50",
    },
    { label: "Classify & prioritize", sub: "Agent · mirrorpilot", dark: true, accent: "" },
    { label: "Update CRM & reply", sub: "Action · Salesforce", dark: false, accent: "bg-blue-50" },
  ];
  return (
    <div className="gap-2 p-5 flex flex-col rounded-2xl border border-[#e5e5e5] bg-[#fafafa]">
      {nodes.map((node, i) => (
        <div key={node.label}>
          <div
            className={`gap-3 p-3 flex items-center rounded-xl border ${
              node.dark ? "border-[#171717] bg-[#0a0a0a]" : "bg-white border-[#e5e5e5]"
            }`}
          >
            <div
              className={`size-7 shrink-0 rounded-lg ${node.dark ? "bg-white/10" : node.accent}`}
            />
            <div>
              <p className={`text-xs font-medium ${node.dark ? "text-white" : "text-[#0a0a0a]"}`}>
                {node.label}
              </p>
              <p className={`text-[10px] ${node.dark ? "text-white/50" : "text-[#737373]"}`}>
                {node.sub}
              </p>
            </div>
            {!node.dark && (
              <span className="bg-green-50 px-2 py-0.5 font-medium text-green-600 ml-auto rounded-full text-[10px]">
                Active
              </span>
            )}
          </div>
          {i < nodes.length - 1 && <div className="ml-6 h-4 w-px bg-[#e5e5e5]" />}
        </div>
      ))}
    </div>
  );
}

function MemoryVisual() {
  const entries = [
    { key: "Name", value: "James Okonkwo" },
    { key: "Plan", value: "Pro · renews Dec 12" },
    { key: "Sentiment", value: "Positive · NPS 8" },
    { key: "Last contact", value: "Phone · 3 days ago" },
    { key: "Open issues", value: "None" },
    { key: "Preferred channel", value: "SMS" },
  ];
  return (
    <div className="bg-white p-5 shadow-sm rounded-2xl border border-[#e5e5e5]">
      <p className="mb-3 font-semibold tracking-wider text-[10px] text-[#737373] uppercase">
        Unified Customer Memory
      </p>
      <div className="gap-2 flex flex-col">
        {entries.map((e) => (
          <div
            key={e.key}
            className="pb-1.5 flex items-center justify-between border-b border-[#f5f5f5]"
          >
            <span className="text-xs text-[#737373]">{e.key}</span>
            <span className="text-xs font-medium text-[#0a0a0a]">{e.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsVisual() {
  const bars = [55, 70, 45, 85, 60, 92, 78, 88, 65, 95, 80, 100];
  const stats = [
    { label: "Conversations today", value: "1,284" },
    { label: "Avg resolution time", value: "1m 42s" },
    { label: "Customer satisfaction", value: "96%" },
  ];
  return (
    <div className="gap-4 bg-white p-5 shadow-sm flex flex-col rounded-2xl border border-[#e5e5e5]">
      <div className="gap-3 grid grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="p-3 rounded-xl border border-[#e5e5e5] bg-[#fafafa] text-center"
          >
            <p className="text-lg font-bold text-[#0a0a0a]">{s.value}</p>
            <p className="text-[10px] text-[#737373]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="h-24 gap-1 p-3 flex items-end rounded-xl bg-[#fafafa]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-[#0a0a0a]"
            style={{ height: `${h}%`, opacity: 0.1 + (i / bars.length) * 0.9 }}
          />
        ))}
      </div>
    </div>
  );
}

const VISUALS = {
  chat: ChatVisual,
  workflow: WorkflowVisual,
  memory: MemoryVisual,
  analytics: AnalyticsVisual,
};

export function ProductFeatures() {
  return (
    <div>
      {features.map((feature) => {
        const Icon = feature.icon;
        const Visual = VISUALS[feature.visual];
        const isImageLeft = feature.imagePosition === "left";

        return (
          <section key={feature.tag} className={`border-b border-[#e5e5e5] ${feature.bg}`}>
            <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
              <div
                className={`gap-10 lg:items-center lg:gap-16 flex flex-col ${isImageLeft ? "lg:flex-row-reverse" : "lg:flex-row"}`}
              >
                {/* Text block */}
                <div className="gap-6 lg:w-[44%] lg:shrink-0 flex flex-col">
                  <div className="gap-2 flex items-center">
                    <div
                      className={`size-8 flex items-center justify-center rounded-xl ${feature.iconBg}`}
                    >
                      <Icon size={16} className={feature.iconColor} />
                    </div>
                    <span className="text-sm font-semibold text-[#737373]">{feature.tag}</span>
                  </div>
                  <h2 className="text-2xl font-semibold lg:text-3xl leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                    {feature.title}
                  </h2>
                  <p className="text-base leading-[27px] text-[#404040]">{feature.description}</p>
                  <ul className="gap-3 flex flex-col">
                    {feature.points.map((point) => (
                      <li key={point} className="gap-2.5 flex items-center">
                        <Check size={15} className="text-green-500 shrink-0" />
                        <span className="text-sm text-[#404040]">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Visual mockup */}
                <div className="lg:flex-1">
                  <Visual />
                </div>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
