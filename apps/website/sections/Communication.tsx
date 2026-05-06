import AlternatingFeature from "@/components/AlternatingFeature";
import teamAutonomyImg from "@/assets/images/dashboard/team autonomy.png";
import promptBuilderImg from "@/assets/images/dashboard/prompt-to-workflow builder.png";
import monitorImg from "@/assets/images/dashboard/monitor.png";

export default function Communication() {
  return (
    <>
      <section className="mx-auto flex flex-col gap-[var(--spacing-64)] mt-[100px] px-[var(--spacing-16)] lg:px-0 items-center">
        <AlternatingFeature
          title="Team autonomy"
          description="Give every employee safe, no-code superpowers to automate repetitive tasks in seconds — freeing them to focus on creative, high-value work."
          imageSrc={teamAutonomyImg}
          imagePosition="right"
        />

        <AlternatingFeature
          title="Prompt-to-workflow builder"
          description="Describe what you want in plain English and watch Mirrropilot instantly build powerful, customizable automations — no code, no waiting."
          imageSrc={promptBuilderImg}
          imagePosition="left"
        />

        <AlternatingFeature
          title="Full visibility"
          description="Every action, decision and data touch is logged and visualized in real time, so you can trust, audit and improve with enterprise-grade clarity."
          imageSrc={monitorImg}
          imagePosition="right"
        />
      </section>
    </>
  );
}
