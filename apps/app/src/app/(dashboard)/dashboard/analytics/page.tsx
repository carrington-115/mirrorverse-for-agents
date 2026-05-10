import AnalyticsChart from "./_components/analytics-chart";
import CallsChart from "./_components/calls-chart";
import EmailsChart from "./_components/emails-chart";
import ChatsChart from "./_components/chats-chart";

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsChart />
      <div className="flex w-full justify-between gap-[10px]">
        <CallsChart />
        <EmailsChart />
        <ChatsChart />
      </div>
    </>
  );
}
