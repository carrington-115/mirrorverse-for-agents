import {
  Phone,
  MessageSquare,
  Mail,
  Globe,
  MessageCircle,
  Users,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import { Icon as IconifyIcon } from "@iconify/react";
import { SectionHeader } from "@/components/section-header";

const channels = [
  { icon: Phone, label: "Phone" },
  { icon: MessageSquare, label: "SMS" },
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Mail, label: "Email" },
  { icon: Globe, label: "Live Chat" },
];

const roles = [
  { name: "Alex Rivera", role: "Admin", color: "bg-violet-100 text-violet-700" },
  { name: "Jordan Kim", role: "Manager", color: "bg-blue-100 text-blue-700" },
  { name: "Sam Patel", role: "Agent", color: "bg-green-100 text-green-700" },
  { name: "Taylor Wu", role: "Viewer", color: "bg-gray-100 text-gray-600" },
];

const integrationIcons = [
  { icon: "simple-icons:slack", color: "#4A154B", name: "Slack" },
  { icon: "simple-icons:salesforce", color: "#00A1E0", name: "Salesforce" },
  { icon: "simple-icons:hubspot", color: "#FF7A59", name: "HubSpot" },
  { icon: "simple-icons:calendly", color: "#006BFF", name: "Calendly" },
  { icon: "simple-icons:notion", color: "#000000", name: "Notion" },
  { icon: "simple-icons:gmail", color: "#EA4335", name: "Gmail" },
  { icon: "simple-icons:googledrive", color: "#4285F4", name: "Google Drive" },
  { icon: "simple-icons:intercom", color: "#1F8DED", name: "Intercom" },
];

export function Features() {
  return (
    <section id="features" className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <SectionHeader
          title="Everything you need, nothing you don't"
          subtitle="Built for teams that demand results — not tools that get in the way."
        />

        <div className="mt-14 gap-4 flex flex-col">
          {/* ── Top row: Multichannel + Team ─────────────────────────────── */}
          <div className="gap-4 lg:grid-cols-5 grid grid-cols-1">
            {/* Multichannel — 2/5 */}
            <div className="gap-6 p-6 md:p-8 lg:col-span-2 flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
              <div className="gap-3 flex flex-col">
                <span className="bg-white px-3 py-1 text-xs font-medium w-fit rounded-full border border-[#e5e5e5] text-[#404040]">
                  Multichannel
                </span>
                <h3 className="text-xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                  One agent, every channel
                </h3>
                <p className="text-sm leading-[22px] text-[#404040]">
                  Reach and serve customers across phone, SMS, WhatsApp, email, and live chat — with
                  one consistent, context-aware agent.
                </p>
              </div>
              <div className="gap-2 grid grid-cols-1">
                {channels.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="gap-2.5 bg-white px-3 py-2.5 flex items-center rounded-xl border border-[#e5e5e5]"
                  >
                    <Icon size={15} className="shrink-0 text-[#404040]" />
                    <span className="text-sm font-medium text-[#0a0a0a]">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Team & permissions — 3/5 */}
            <div className="gap-6 p-6 md:p-8 lg:col-span-3 flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
              <div className="gap-3 flex flex-col">
                <span className="bg-white px-3 py-1 text-xs font-medium w-fit rounded-full border border-[#e5e5e5] text-[#404040]">
                  Team Management
                </span>
                <h3 className="text-xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                  The right access for the right people
                </h3>
                <p className="text-sm leading-[22px] text-[#404040]">
                  Manage roles, set permissions, and keep every department aligned — even as your
                  team scales.
                </p>
              </div>
              <div className="gap-2 flex flex-col">
                {roles.map((role) => (
                  <div
                    key={role.name}
                    className="bg-white px-4 py-3 flex items-center justify-between rounded-xl border border-[#e5e5e5]"
                  >
                    <div className="gap-3 flex items-center">
                      <div className="size-8 flex items-center justify-center rounded-full bg-[#f5f5f5]">
                        <Users size={14} className="text-[#737373]" />
                      </div>
                      <span className="text-sm font-medium text-[#0a0a0a]">{role.name}</span>
                    </div>
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${role.color}`}>
                      {role.role}
                    </span>
                  </div>
                ))}
                <div className="gap-2 px-4 py-3 flex items-center rounded-xl border border-dashed border-[#e5e5e5]">
                  <ShieldCheck size={14} className="text-[#737373]" />
                  <span className="text-sm text-[#737373]">Audit log enabled for all actions</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom: Integrations — full width ───────────────────────── */}
          <div className="gap-8 p-6 md:p-8 lg:flex-row lg:items-center lg:gap-16 lg:p-10 flex flex-col rounded-3xl border border-[#e5e5e5] bg-[#fafafa]">
            <div className="gap-4 lg:w-[38%] lg:shrink-0 flex flex-col">
              <span className="bg-white px-3 py-1 text-xs font-medium w-fit rounded-full border border-[#e5e5e5] text-[#404040]">
                Integrations
              </span>
              <h3 className="text-xl font-semibold leading-[1.2] tracking-[-0.5px] text-[#0a0a0a]">
                Your entire stack, connected in one click
              </h3>
              <p className="text-sm leading-[22px] text-[#404040]">
                Connect Salesforce, Slack, HubSpot, Calendly, and 20+ more tools with native
                integrations. No webhooks to configure, no code to write.
              </p>
              <div className="gap-2 flex items-center">
                <ClipboardList size={14} className="text-[#737373]" />
                <span className="text-sm text-[#737373]">20+ integrations available now</span>
              </div>
            </div>
            <div className="gap-3 sm:grid-cols-4 sm:gap-4 lg:flex-1 grid grid-cols-2">
              {integrationIcons.map(({ icon, color, name }) => (
                <div
                  key={name}
                  title={name}
                  className="bg-white p-3 shadow-sm sm:p-4 flex items-center justify-center rounded-2xl border border-[#e5e5e5]"
                >
                  <IconifyIcon icon={icon} width={28} height={28} color={color} aria-label={name} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
