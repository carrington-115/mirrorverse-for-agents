import { UseCaseDetail } from "@/lib/use-cases-data";

interface UseCaseHowItWorksProps {
  useCase: UseCaseDetail;
}

export function UseCaseHowItWorks({ useCase }: UseCaseHowItWorksProps) {
  return (
    <section className="bg-white border-b border-[#e5e5e5]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        {/* Section label */}
        <p className="text-xs font-semibold tracking-widest mb-4 text-[#737373] uppercase">
          How it works
        </p>
        <h2 className="text-2xl font-semibold mb-14 lg:text-3xl max-w-[560px] tracking-[-0.3px] text-[#0a0a0a]">
          From first contact to resolution — fully automated
        </h2>

        {/* Steps */}
        <div className="gap-0 md:grid-cols-2 grid grid-cols-1">
          {useCase.steps.map((step, index) => (
            <div
              key={step.title}
              className="gap-4 p-8 md:border-l md:first:border-l-0 md:[&:nth-child(odd)]:border-l-0 flex flex-col border-t border-[#e5e5e5] first:border-t"
            >
              {/* Step number */}
              <div className="size-9 text-xs font-semibold text-white flex shrink-0 items-center justify-center rounded-full bg-[#0a0a0a]">
                {String(index + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <div className="gap-2 flex flex-col">
                <h3 className="text-base font-semibold leading-[1.3] tracking-[-0.2px] text-[#0a0a0a]">
                  {step.title}
                </h3>
                <p className="text-sm leading-[22px] text-[#404040]">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
