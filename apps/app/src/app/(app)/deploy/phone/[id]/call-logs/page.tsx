import { CallLogsPage } from "@/features/deploy/pages/call-logs-page";

export { metadata } from "@/features/deploy/pages/call-logs-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CallLogsPage phoneId={id} />;
}
