import AnalyticsChart from "./_components/AnalyticsChart";
import CallsChart from "./_components/CallsChart";
import EmailsChart from "./_components/EmailsChart";
import ChatsChart from "./_components/ChatsChart";

export default function AnalyticsPage() {
  return (
    <>
      <AnalyticsChart />
      <div className="w-full flex justify-between gap-[10px]">
        <CallsChart />
        <EmailsChart />
        <ChatsChart />
      </div>
    </>
  );
}
