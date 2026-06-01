import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { useCaseDetails, getUseCaseBySlug } from "@/lib/use-cases-data";
import { UseCaseDetailHero, UseCaseHowItWorks, UseCaseOutcomes } from "@/sections/use-cases";
import { CtaBanner } from "@/components/cta-banner";

export function generateStaticParams() {
  return useCaseDetails.map((uc) => ({ slug: uc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) return {};
  return {
    title: `${useCase.title} — Mirrorverse`,
    description: useCase.subtitle,
  };
}

export default async function UseCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) notFound();

  return (
    <>
      <UseCaseDetailHero useCase={useCase} />
      <UseCaseHowItWorks useCase={useCase} />
      <UseCaseOutcomes useCase={useCase} />
      <CtaBanner
        title={`Ready to automate your ${useCase.category.toLowerCase()}?`}
        subtitle="Get a personalized walkthrough of how Mirrorverse works for your team."
        primaryLabel="Try for free"
        primaryHref="#"
        secondaryLabel="Book a demo"
        secondaryHref="https://cal.com/frumark/mirrroagents"
      />
    </>
  );
}
