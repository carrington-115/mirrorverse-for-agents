import { UseCaseDetail } from "@/lib/use-cases-data";

interface UseCaseOutcomesProps {
  useCase: UseCaseDetail;
}

export function UseCaseOutcomes({ useCase }: UseCaseOutcomesProps) {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 py-20 lg:px-[120px] lg:py-24 mx-auto max-w-[1188px]">
        <p className="text-xs font-semibold tracking-widest mb-4 text-[#737373] uppercase">
          Results
        </p>
        <h2 className="text-2xl font-semibold mb-12 lg:text-3xl tracking-[-0.3px] text-[#0a0a0a]">
          What teams see after day one
        </h2>

        <div className="gap-4 sm:grid-cols-3 grid grid-cols-1">
          {useCase.outcomes.map((outcome) => (
            <div
              key={outcome}
              className="gap-3 p-7 bg-white flex flex-col rounded-3xl border border-[#e5e5e5]"
            >
              <span className="size-2 bg-green-400 rounded-full" />
              <p className="text-lg font-semibold leading-[1.3] tracking-[-0.2px] text-[#0a0a0a]">
                {outcome}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
