import SummaryChart from "./summary-chart";

export default function DashboardContent() {
  return (
    <div className="flex w-full flex-col items-center gap-(--xl)">
      <SummaryChart />
    </div>
  );
}
