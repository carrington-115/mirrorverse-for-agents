"use client";

import { useListCallsByPhoneQuery } from "@/features/deploy/api/queries";
import { CallLogsTable } from "@/features/deploy/components/phone/call-logs-table";
import { EmptyTabState } from "@/features/deploy/components/phone/empty-tab-state";

interface CallLogsPageProps {
  phoneId: string;
}

export function CallLogsPage({ phoneId }: CallLogsPageProps) {
  const { data: callLogs = [], isLoading } = useListCallsByPhoneQuery(phoneId);

  if (isLoading) {
    return (
      <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
        Loading call logs...
      </div>
    );
  }

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
