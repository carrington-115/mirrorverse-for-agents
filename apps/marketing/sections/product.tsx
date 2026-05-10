import FeatureCard from "@/components/feature-card";
import mirrropilotProduct from "@/assets/images/mirropiliot-product.png";
import workflowProduct from "@/assets/images/automations-product.png";
import memoryProduct from "@/assets/images/shared-memory-product.png";

export default function Product() {
  return (
    <>
      <section
        id="product"
        className="lg:mx-auto lg:px-[var(--spacing-120)] mx-auto mt-(--spacing-120) flex w-[100%] flex-col items-center overflow-x-clip px-(--spacing-16) pb-(--spacing-16)"
      >
        <div className="lg:w-[60%] flex w-fit flex-col justify-center px-(--spacing-20)">
          <h2 className="font-semibold text-center text-[30px] leading-[30px] tracking-[-1px] text-[#171717]">
            One platform. Infinite possibilities
          </h2>
        </div>

        <div className="mt-(--spacing-64) flex w-full max-w-[1188px] flex-col gap-[16px]">
          <FeatureCard
            title="Mirrropilot"
            description="Your AI teammate that thinks, chats, and acts across every channel."
            imageSrc={mirrropilotProduct}
            layout="horizontal"
            containerClassName="bg-[#faf5ff] border-[#e9d5ff]"
            imageContainerClassName="border-[#ede9fe]"
          />

          <div className="lg:flex-row flex w-full flex-col gap-[16px]">
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
