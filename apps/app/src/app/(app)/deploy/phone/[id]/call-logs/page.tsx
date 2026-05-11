import type { Metadata } from "next";
import { CallLogsPage, metadata as pageMetadata } from "@/features/deploy/pages/call-logs-page";

export const metadata: Metadata = pageMetadata;

export default async function Page({ params }: { params: Promise<{ phoneId: string }> }) {
  const { phoneId } = await params;
  return <CallLogsPage phoneId={phoneId} />;
}
