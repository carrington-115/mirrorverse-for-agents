import { MOCK_CALL_LOGS } from "@/lib/data";
import CallLogsTable from "../_components/CallLogsTable";
import EmptyTabState from "../_components/EmptyTabState";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const callLogs = MOCK_CALL_LOGS.filter((log) => log.phoneNumberId === id);

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
