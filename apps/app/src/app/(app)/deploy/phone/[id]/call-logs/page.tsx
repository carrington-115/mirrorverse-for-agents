import { buildMetadata } from "@/lib/seo/metadata";
import { CallLogsPage } from "@/features/deploy/pages/call-logs-page";

export const metadata = buildMetadata({
  title: "Call logs",
  description: "Review call activity for this phone number.",
  noIndex: true,
});

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CallLogsPage phoneId={id} />;
}
