import { Icon } from "@iconify/react";
import Image from "next/image";
import faviconImg from "@/assets/images/mirrorpilot-icon.svg";

interface Integration {
  name: string;
  icon: string;
  color?: string;
  size?: number;
}

const integrations: Integration[] = [
  { name: "Slack", icon: "logos:slack-icon" },
  { name: "ClickUp", icon: "simple-icons:clickup", color: "#7B68EE" },
  { name: "Salesforce", icon: "logos:salesforce", size: 38 },
  { name: "Zendesk", icon: "simple-icons:zendesk", color: "#03363D" },
  { name: "Gmail", icon: "logos:google-gmail" },
  { name: "Stripe", icon: "simple-icons:stripe", color: "#635BFF" },
  { name: "Notion", icon: "logos:notion-icon" },
  { name: "Mailchimp", icon: "simple-icons:mailchimp", color: "#FFE01B" },
  { name: "Google Calendar", icon: "logos:google-calendar" },
  { name: "HubSpot", icon: "simple-icons:hubspot", color: "#FF7A59" },
  { name: "Google Drive", icon: "logos:google-drive" },
];

export function IntegrationsBar() {
  return (
    <div className="w-full border-t border-b border-[var(--border)] bg-[#f5f5f5]">
      <div className="gap-6 px-5 py-10 md:flex-row md:gap-8 md:py-12 lg:px-[144px] md:items-center md:w-auto mx-auto flex w-full max-w-[1440px] flex-col items-start justify-between">
        {/* Left: Mirrorpilot branding */}
        <div className="md:w-auto gap-3 md:items-start md:block md:flex-col flex w-full shrink-0 items-center">
          <div className="flex items-center gap-[7px]">
            <div className="relative h-[28px] w-[28px] shrink-0">
              <Image src={faviconImg} alt="mirrorpilot icon" fill className="object-contain" />
            </div>
            <span className="font-semibold leading-tight text-[27px] tracking-[-0.87px] text-[#171717]">
              Mirrorpilot
            </span>
          </div>
          <div className="gap-1 flex items-center text-[#737373]">
            <span className="text-xs font-medium w-[93px] leading-[16px]">
              Connects with your 24/7 stack
            </span>
            <span className="md:block text-xl font-semibold hidden text-[#171717]">30+ apps</span>
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
