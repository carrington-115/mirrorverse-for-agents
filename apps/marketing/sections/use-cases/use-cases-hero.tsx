import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import MirrorpilotLogo from "@/assets/images/mirrorpilot-icon-dark.svg";

export function UseCasesHero() {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto flex max-w-[1188px] flex-col items-center pt-[140px] text-center">
        <SectionHeader
          title="Built for teams that mean business"
          subtitle="Whether you're in customer support, sales, HR, or finance — mirrorverse has a workflow for you. See how leading teams automate the work that matters."
        />
        <Button
          className="gap-2 text-lg px-8 py-5 font-normal mt-2 flex cursor-pointer items-center justify-center rounded-full hover:bg-accent-foreground"
          size={"lg"}
        >
          <Image src={MirrorpilotLogo} alt="" width={24} height={24} />
          Try Mirrorpilot
        </Button>
      </div>
    </section>
  );
}
