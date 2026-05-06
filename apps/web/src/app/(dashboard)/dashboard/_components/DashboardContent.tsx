import SummaryChart from "./SummaryChart";

export default function DashboardContent() {
  return (
    <div className="w-full flex flex-col items-center gap-[var(--xl)]">
      <SummaryChart />
    </div>
  );
}
