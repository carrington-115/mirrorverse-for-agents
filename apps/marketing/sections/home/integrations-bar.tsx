import { Icon } from "@iconify/react";
import Image from "next/image";
import faviconImg from "@/assets/images/favicon.svg";

interface Integration {
  name: string;
  icon: string;
  color: string;
  size?: number;
}

const integrations: Integration[] = [
  { name: "Slack", icon: "simple-icons:slack", color: "#4A154B" },
  { name: "Intercom", icon: "simple-icons:intercom", color: "#1F8DED" },
  { name: "Salesforce", icon: "simple-icons:salesforce", color: "#00A1E0", size: 38 },
  { name: "Zendesk", icon: "simple-icons:zendesk", color: "#03363D" },
  { name: "Gmail", icon: "simple-icons:gmail", color: "#EA4335" },
  { name: "Cal.com", icon: "simple-icons:caldotcom", color: "#111827" },
  { name: "Notion", icon: "simple-icons:notion", color: "#000000" },
  { name: "Calendly", icon: "simple-icons:calendly", color: "#006BFF" },
  { name: "Google Calendar", icon: "simple-icons:googlecalendar", color: "#4285F4" },
  { name: "HubSpot", icon: "simple-icons:hubspot", color: "#FF7A59" },
  { name: "Google Drive", icon: "simple-icons:googledrive", color: "#4285F4" },
];

export function IntegrationsBar() {
  return (
    <div className="w-full border-t border-b border-[var(--border)] bg-[#f5f5f5]">
      <div className="gap-6 px-5 py-10 md:flex-row md:gap-8 md:py-12 lg:px-[144px] mx-auto flex max-w-[1440px] flex-col items-center justify-between">
        {/* Left: Mirrorpilot branding */}
        <div className="gap-3 md:items-start flex shrink-0 flex-col items-center">
          <div className="flex items-center gap-[7px]">
            <div className="relative h-[28px] w-[28px] shrink-0">
              <Image src={faviconImg} alt="mirrorpilot icon" fill className="object-contain" />
            </div>
            <span className="font-semibold leading-tight text-[27px] tracking-[-0.87px] text-[#171717]">
              mirrorpilot
            </span>
          </div>
          <div className="gap-1 flex items-center text-[#737373]">
            <span className="text-xs font-medium w-[93px] leading-[16px]">
              Connects with your 24/7 stack
            </span>
            <span className="text-xl font-semibold text-[#171717]">20+ apps</span>
          </div>
        </div>

        {/* Right: integration logo strip — marquee on mobile, static on desktop */}
        <div className="md:w-auto relative w-full overflow-hidden">
          {/* Static row for md+ */}
          <div className="gap-10 md:flex lg:gap-12 hidden items-center">
            {integrations.map(({ name, icon, color, size = 28 }) => (
              <Icon
                key={name}
                icon={icon}
                width={size}
                height={size}
                color={color}
                aria-label={name}
              />
            ))}
          </div>

          {/* Scrolling marquee for mobile */}
          <div className="md:hidden flex">
            <div className="animate-marquee gap-8 flex shrink-0 items-center">
              {integrations.map(({ name, icon, color, size = 24 }) => (
                <Icon
                  key={name}
                  icon={icon}
                  width={size}
                  height={size}
                  color={color}
                  aria-label={name}
                />
              ))}
              {/* Duplicate for seamless loop */}
              {integrations.map(({ name, icon, color, size = 24 }) => (
                <Icon
                  key={`dup-${name}`}
                  icon={icon}
                  width={size}
                  height={size}
                  color={color}
                  aria-label={name}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
