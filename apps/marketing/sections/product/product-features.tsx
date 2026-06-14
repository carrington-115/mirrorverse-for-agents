import {
  Bot,
  GitBranch,
  BookOpen,
  Phone,
  Plug,
  Check,
  Search,
  FileText,
  CheckCircle2,
  MessageSquare,
  Mail,
  Send,
  Mic,
  Zap,
} from "lucide-react";
import { Icon as IconifyIcon } from "@iconify/react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "mirrorpilot",
    tag: "Mirrorpilot",
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
    id: "workflows",
    tag: "Workflows",
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
    id: "knowledge",
    tag: "Knowledge Bases",
    icon: BookOpen,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    title: "Give your agents the right knowledge.",
    description:
      "Upload PDFs, docs, and FAQs. Agents retrieve exactly what they need — grounding every response in your actual content, not guesswork.",
    points: [
      "Upload PDFs, docs & web pages",
      "RAG-powered retrieval",
      "Per-agent knowledge binding",
      "Automatic re-indexing on update",
    ],
    imagePosition: "right" as const,
    visual: "knowledge" as const,
    bg: "bg-white",
  },
  {
    id: "channels",
    tag: "Channels",
    icon: Phone,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    title: "Deploy across every channel in minutes.",
    description:
      "Connect a phone number or Telegram bot and your agent is live. Manage calls, chats, and logs from one unified dashboard.",
    points: [
      "Phone & Telegram",
      "Call logs & conversation history",
      "Live agent handoff",
      "Multi-number routing",
    ],
    imagePosition: "left" as const,
    visual: "channels" as const,
    bg: "bg-[#fafafa]",
  },
  {
    id: "voice",
    tag: "Voice Agents",
    icon: Mic,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    title: "Conversations that sound human.",
    description:
      "Your agent picks up the phone and holds natural, low-latency voice conversations — with realistic voices, real-time interruption handling, and full transcripts of every call.",
    points: [
      "Realistic, configurable voices",
      "Real-time interruption handling",
      "Live transcription & call recordings",
      "Seamless handoff to a human rep",
    ],
    imagePosition: "right" as const,
    visual: "voice" as const,
    bg: "bg-white",
  },
  {
    id: "integrations",
    tag: "Integrations",
    icon: Plug,
    iconBg: "bg-[#f5f5f5]",
    iconColor: "text-[#404040]",
    title: "Your stack, connected out of the box.",
    description:
      "Tap into 200+ tools — Salesforce, HubSpot, Slack, Gmail, Calendly, and more. Wire them to any agent in two clicks via Composio.",
    points: [
      "200+ tools via Composio",
      "One-click OAuth connections",
      "Custom webhook support",
      "No code, no credentials to manage",
    ],
    imagePosition: "left" as const,
    visual: "integrations" as const,
    bg: "bg-[#fafafa]",
  },
];

// ── Visual components ───────────────────────────────────────────────────────

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
          { type: "user", text: "I'd like to switch to annual billing." },
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
            >
              {msg.text}
            </div>
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

const kbItems = [
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

function KnowledgeBaseVisual() {
  return (
    <div className="bg-white shadow-sm p-5 gap-3 flex flex-col rounded-2xl border border-[#e5e5e5]">
      <div className="gap-2 px-3.5 py-2.5 flex items-center rounded-xl border border-[#e5e5e5] bg-[#fafafa]">
        <Search size={13} className="shrink-0 text-[#a3a3a3]" />
        <span className="text-sm text-[#a3a3a3]">Search knowledge bases…</span>
      </div>
      {kbItems.map(({ name, count, Icon, iconCls }) => (
        <div
          key={name}
          className="gap-3 px-3.5 py-3 flex items-center rounded-xl border border-[#e5e5e5] bg-[#fafafa]"
        >
          <div
            className={cn("size-8 flex shrink-0 items-center justify-center rounded-lg", iconCls)}
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
  );
}

const channelItems = [
  {
    Icon: Phone,
    label: "Phone",
    detail: "+1 (555) 000-1234 · 3 active calls",
    iconCls: "text-blue-600 bg-blue-50",
  },
  {
    Icon: MessageSquare,
    label: "SMS",
    detail: "Auto-reply enabled",
    iconCls: "text-violet-600 bg-violet-50",
  },
  {
    Icon: Send,
    label: "Telegram",
    detail: "@acme_support_bot · 28 chats",
    iconCls: "text-sky-600 bg-sky-50",
  },
  { Icon: Mail, label: "Email", detail: "support@acme.com", iconCls: "text-amber-600 bg-amber-50" },
];

function ChannelsVisual() {
  return (
    <div className="bg-white shadow-sm p-5 gap-2.5 flex flex-col rounded-2xl border border-[#e5e5e5]">
      <div className="gap-2.5 grid grid-cols-2">
        {channelItems.map(({ Icon, label, detail, iconCls }) => (
          <div
            key={label}
            className="gap-3 px-3.5 py-3.5 flex items-start rounded-xl border border-[#e5e5e5] bg-[#fafafa]"
          >
            <div
              className={cn("size-8 flex shrink-0 items-center justify-center rounded-lg", iconCls)}
            >
              <Icon size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="gap-1.5 flex items-center">
                <span className="text-xs font-semibold text-[#0a0a0a]">{label}</span>
                <span className="size-1.5 bg-emerald-500 shrink-0 rounded-full" />
              </div>
              <div className="text-[10px] leading-[14px] text-[#737373]">{detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const waveformBars = [6, 14, 9, 20, 12, 26, 16, 10, 22, 14, 8, 18, 11, 24, 15, 7];

function VoiceVisual() {
  return (
    <div className="bg-white shadow-sm overflow-hidden rounded-2xl border border-[#e5e5e5]">
      <div className="gap-2 px-4 py-3 flex items-center border-b border-[#e5e5e5] bg-[#fafafa]">
        <div className="size-6 flex items-center justify-center rounded-full bg-[#0a0a0a]">
          <Phone size={11} className="text-white" />
        </div>
        <span className="text-xs font-semibold text-[#0a0a0a]">Live call · Sales Agent</span>
        <span className="gap-1.5 ml-auto flex items-center text-[10px] text-[#737373]">
          <span className="size-1.5 bg-red-500 rounded-full" />
          02:47
        </span>
      </div>
      <div className="gap-4 p-5 flex flex-col">
        <div className="h-12 flex items-end justify-center gap-[3px]">
          {waveformBars.map((h, i) => (
            <div key={i} className="w-1 bg-rose-400/70 rounded-full" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="gap-2 flex flex-col">
          <p className="text-xs leading-[18px] text-[#737373]">
            <span className="font-semibold text-[#0a0a0a]">Caller:</span> &quot;Can you check on my
            order from last week?&quot;
          </p>
          <p className="text-xs leading-[18px] text-[#737373]">
            <span className="font-semibold text-[#0a0a0a]">Agent:</span> &quot;Of course — pulling
            that up now. One moment…&quot;
          </p>
        </div>
      </div>
    </div>
  );
}

const integrationIcons = [
  { icon: "logos:slack-icon", name: "Slack" },
  { icon: "logos:salesforce", name: "Salesforce" },
  { icon: "simple-icons:hubspot", color: "#FF7A59", name: "HubSpot" },
  { icon: "simple-icons:mailchimp", color: "#FFE01B", name: "Mailchimp" },
  { icon: "logos:notion-icon", name: "Notion" },
  { icon: "logos:google-gmail", name: "Gmail" },
  { icon: "logos:google-drive", name: "Google Drive" },
  { icon: "simple-icons:clickup", color: "#7B68EE", name: "ClickUp" },
];

function IntegrationsVisual() {
  return (
    <div className="bg-white shadow-sm p-5 gap-4 flex flex-col rounded-2xl border border-[#e5e5e5]">
      <div className="gap-2.5 grid grid-cols-4">
        {integrationIcons.map(({ icon, color, name }) => (
          <div
            key={name}
            title={name}
            className="p-3 flex items-center justify-center rounded-xl border border-[#e5e5e5] bg-[#fafafa]"
          >
            <IconifyIcon icon={icon} width={24} height={24} color={color} aria-label={name} />
          </div>
        ))}
      </div>
      <div className="gap-2 px-3.5 py-2.5 flex items-center rounded-xl border border-dashed border-[#e5e5e5]">
        <Zap size={13} className="shrink-0 text-[#737373]" />
        <span className="text-xs text-[#737373]">20+ integrations available now</span>
      </div>
    </div>
  );
}

const VISUALS = {
  chat: ChatVisual,
  workflow: WorkflowVisual,
  knowledge: KnowledgeBaseVisual,
  channels: ChannelsVisual,
  voice: VoiceVisual,
  integrations: IntegrationsVisual,
};

// ── Section ─────────────────────────────────────────────────────────────────

export function ProductFeatures() {
  return (
    <div>
      {features.map((feature) => {
        const Icon = feature.icon;
        const Visual = VISUALS[feature.visual];
        const isImageLeft = feature.imagePosition === "left";

        return (
          <section
            id={feature.id}
            key={feature.tag}
            className={`border-b border-[#e5e5e5] ${feature.bg}`}
          >
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
                  <p className="text-xl font-normal md:font-medium lg:text-[18px] leading-[27px] text-[#404040]">
                    {feature.description}
                  </p>
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
