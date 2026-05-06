import FeatureCard from "@/components/FeatureCard";
import channelsImg from "@/assets/images/channels/channels.png";
import teamOrganizationImg from "@/assets/images/channels/team-feature.png";
import integrationsImg from "@/assets/images/channels/integrations-feature.png";

export default function Features() {
  return (
    <section
      id="features"
      className="lg:w-[100%] lg:flex lg:flex-col lg:justify-center items-center overflow-x-clip mt-[var(--spacing-32)] px-[var(--spacing-16)] lg:px-[var(--spacing-120)] pb-[var(--spacing-16)]"
    >
      <div className="w-full flex flex-col gap-[16px] mt-[var(--spacing-64)] max-w-[1188px] mx-auto">
        {/* Top Row - Vertical split */}
        <div className="flex flex-col lg:flex-row gap-[16px] w-full">
          {/* Multi-channel communication */}
          <FeatureCard
            title="Multi-channel communication"
            description="Reach and serve customers instantly across phone, SMS, WhatsApp, Telegram, Messenger and more — with one consistent, context-aware agent."
            imageSrc={channelsImg}
            layout="vertical"
            containerClassName="bg-[#eef2ff] border-[#c7d2fe] lg:w-[45%] h-auto"
            imageContainerClassName="w-full border-transparent border-0 bg-transparent flex justify-center items-center p-0 !border-none"
            imageClassName="lg:w-full w-full h-auto object-contain"
          />

          {/* Team organization and management */}
          <FeatureCard
            title="Team organization and management"
            description="See who has access to what, manage roles and permissions in one place, and keep every department perfectly aligned — even as your company grows."
            imageSrc={teamOrganizationImg}
            layout="vertical"
            containerClassName="bg-[#fafafa] border-[#e5e5e5] lg:w-[60%] h-auto items-end pt-[var(--spacing-32)] pl-[var(--spacing-32)] pr-[var(--spacing-32)]"
            contentClassName="self-start"
            imageContainerClassName="border-[#e5e5e5] border-[3px] border-b-0 rounded-b-none lg:w-[80%] ml-auto"
            imageClassName="w-full h-auto object-cover object-left-top"
          />
        </div>

        {/* Bottom Row - Horizontal */}
        <FeatureCard
          title="Integrations"
          description="Connect every tool you already use — CRMs, calendars, payment systems, messaging apps — and let mirrroverse turn your existing software into a unified intelligent brain."
          imageSrc={integrationsImg}
          layout="horizontal"
          containerClassName="bg-[#f0f9ff] border-[#bae6fd]"
          imageContainerClassName="lg:w-[50%] !border-none flex items-start justify-center"
          imageClassName="w-full lg:w-[80%] h-auto object-contain"
        />
      </div>
    </section>
  );
}
