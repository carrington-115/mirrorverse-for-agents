"use client";

import IllustrationStepComponent from "@/components/IllustrationStepComponent";
import workflowImg from "@/assets/images/deploy/workflow-step.svg";
import toolsImg from "@/assets/images/deploy/tools-step.svg";
import automateImg from "@/assets/images/deploy/automate-step.svg";
import deployImg from "@/assets/images/deploy/deploy-step.svg";

export default function Updates() {
  return (
    <section
      id="how-it-works"
      className="mx-auto mt-[var(--spacing-32)] flex flex-col items-center w-full px-[var(--spacing-16)] lg:px-[var(--spacing-120)] gap-[var(--spacing-64)] lg:gap-[var(--spacing-120)] max-w-[1440px]"
    >
      <div className="flex flex-col gap-[var(--spacing-32)] w-full items-center">
        <h2 className="font-semibold text-3xl lg:text-[30px] leading-[30px] tracking-[-1px] text-[var(--general-secondary-foreground,#171717)] text-center">
          How Mirrro works
        </h2>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[var(--spacing-16)] lg:gap-[var(--spacing-16)]">
          <IllustrationStepComponent
            title="Design workflows"
            description="Drag-and-drop triggers, escalations, nodes, and tools to map out automated processes, ensuring seamless flow between sales, ops, HR, and more."
            imageSrc={workflowImg}
          />
          <IllustrationStepComponent
            title="Connect Your Tools"
            description="Integrate your apps (like Salesforce, Slack, or Stripe) to give mirrroverse access to your data and enable real actions across departments."
            imageSrc={toolsImg}
          />
          <IllustrationStepComponent
            title="Automate and scale"
            description="Let mirrroPilot take over repetitive tasks organization-wide — freeing your team to focus on what truly matters."
            imageSrc={automateImg}
          />
          <IllustrationStepComponent
            title="Deploy and monitor"
            description="Deploy agents, watch realtime analytics on and monitor outcomes, and iterate as needed to scale efficiency across your entire business."
            imageSrc={deployImg}
          />
        </div>
      </div>
    </section>
  );
}
