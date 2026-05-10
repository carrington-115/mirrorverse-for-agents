import { buildMetadata } from "@/lib/seo/metadata";
import { MOCK_CALL_LOGS } from "@/lib/data";
import { CallLogsTable } from "@/features/deploy/components/phone/call-logs-table";
import { EmptyTabState } from "@/features/deploy/components/phone/empty-tab-state";

export const metadata = buildMetadata({
  title: "Call logs",
  description: "Review call activity for this phone number.",
  noIndex: true,
});

interface CallLogsPageProps {
  phoneId: string;
}

export function CallLogsPage({ phoneId }: CallLogsPageProps) {
  const callLogs = MOCK_CALL_LOGS.filter((log) => log.phoneNumberId === phoneId);

  if (callLogs.length === 0) {
    return (
      <EmptyTabState
        title="No calls yet"
        description="Once your phone numbers are added and agents are deployed, every inbound and outbound call will be logged here"
      />
    );
  }

  return <CallLogsTable data={callLogs} />;
}
