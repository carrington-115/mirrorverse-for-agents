import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UseCaseDetail } from "@/lib/use-cases-data";

interface UseCaseDetailHeroProps {
  useCase: UseCaseDetail;
}

export function UseCaseDetailHero({ useCase }: UseCaseDetailHeroProps) {
  return (
    <section className="border-b border-[#e5e5e5] bg-[#fafafa]">
      <div className="px-5 pb-16 lg:pb-20 lg:pt-[160px] mx-auto flex max-w-[1188px] flex-col items-center pt-[140px]">
        {/* Back link */}
        <div className="mb-8 w-full">
          <Link
            href="/use-cases"
            className="gap-1.5 text-sm inline-flex items-center text-[#737373] transition-colors hover:text-[#0a0a0a]"
          >
            <ArrowLeft size={14} />
            All use cases
          </Link>
        </div>

        {/* Category badge */}
        <div className="mb-4 w-full">
          <span
            className={`px-3 py-1 text-xs font-semibold inline-flex items-center rounded-full ${useCase.iconBg} ${useCase.iconColor}`}
          >
            {useCase.category}
          </span>
        </div>

        {/* Title + subtitle */}
        <div className="mb-10 w-full max-w-[780px]">
          <h1 className="text-4xl font-semibold mb-4 lg:text-5xl leading-[1.15] tracking-[-0.5px] text-[#0a0a0a]">
            {useCase.title}
          </h1>
          <p className="text-lg leading-[1.6] text-[#404040]">{useCase.subtitle}</p>
        </div>

        {/* Image */}
        <div className="shadow-sm relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-[#e5e5e5]">
          <Image
            src={useCase.image}
            alt={useCase.title}
            fill
            sizes="(max-width: 1188px) 100vw, 1188px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
