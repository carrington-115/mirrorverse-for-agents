import { ReviewPage } from "@/features/runs/pages/review-page";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Review request",
  description: "Review and respond to a workflow approval request.",
  noIndex: true,
});

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ReviewPage token={token} />;
}
