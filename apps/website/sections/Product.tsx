import FeatureCard from "@/components/FeatureCard";
import mirrropilotProduct from "@/assets/images/mirropiliot-product.png";
import workflowProduct from "@/assets/images/automations-product.png";
import memoryProduct from "@/assets/images/shared-memory-product.png";

export default function Product() {
  return (
    <>
      <section
        id="product"
        className="mx-auto overflow-x-clip lg:mx-auto w-[100%] flex flex-col items-center mt-[var(--spacing-120)] px-[var(--spacing-16)] lg:px-[var(--spacing-120)] pb-[var(--spacing-16)]"
      >
        <div className="w-fit lg:w-[60%] flex flex-col justify-center px-[var(--spacing-20)]">
          <h2 className="text-center font-semibold text-[30px] leading-[30px] tracking-[-1px] text-[#171717]">
            One platform. Infinite possibilities
          </h2>
        </div>

        <div className="w-full flex flex-col gap-[16px] mt-[var(--spacing-64)] max-w-[1188px]">
          <FeatureCard
            title="Mirrropilot"
            description="Your AI teammate that thinks, chats, and acts across every channel."
            imageSrc={mirrropilotProduct}
            layout="horizontal"
            containerClassName="bg-[#faf5ff] border-[#e9d5ff]"
            imageContainerClassName="border-[#ede9fe]"
          />

          <div className="flex flex-col lg:flex-row gap-[16px] w-full">
            <FeatureCard
              title="No-code flows"
              description="Build powerful automations with drag-and-drop — no developers required."
              imageSrc={workflowProduct}
              layout="vertical"
              containerClassName="bg-[#fff7ed] border-[#fed7aa] lg:w-[60%] h-auto"
              imageContainerClassName="border-[#ffedd5]"
            />

            <FeatureCard
              title="Shared memory"
              description="Every agent remembers everything — no more dropped context, ever."
              imageSrc={memoryProduct}
              layout="vertical"
              containerClassName="bg-[#fffbeb] border-[#fde68a] lg:w-[40%] h-auto"
              imageContainerClassName="border-[#fef9c3]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
