"use client";

import IllustrationStepComponent from "@/components/illustration-step-component";
import workflowImg from "@/assets/images/deploy/workflow-step.svg";
import toolsImg from "@/assets/images/deploy/tools-step.svg";
import automateImg from "@/assets/images/deploy/automate-step.svg";
import deployImg from "@/assets/images/deploy/deploy-step.svg";

export default function Updates() {
  return (
    <section
      id="how-it-works"
      className="lg:px-[var(--spacing-120)] lg:gap-[var(--spacing-120)] mx-auto mt-(--spacing-32) flex w-full max-w-[1440px] flex-col items-center gap-(--spacing-64) px-(--spacing-16)"
    >
      <div className="flex w-full flex-col items-center gap-(--spacing-32)">
        <h2 className="font-semibold text-3xl lg:text-[30px] text-center leading-[30px] tracking-[-1px] text-(--general-secondary-foreground,#171717)">
          How Mirrro works
        </h2>

        <div className="md:grid-cols-2 lg:grid-cols-4 lg:gap-[var(--spacing-16)] grid w-full grid-cols-1 gap-(--spacing-16)">
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
            description="Let Mirrorpilot take over repetitive tasks organization-wide — freeing your team to focus on what truly matters."
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
