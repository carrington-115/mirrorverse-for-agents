"use client";

import { ClockArrowUp, Clock9 } from "lucide-react";
import { Card } from "@/components/ui/card";
import AgentCallActivityChart from "./agent-call-activity-chart";
import EscalationTrendChart from "./escalation-trend-chart";

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="w-[200px] shrink-0 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="p-2 flex items-center justify-between">
        <Icon className="h-6 w-6 text-foreground" />
        <span className="bg-green-700 px-2 py-0.5 text-xs font-semibold text-white inline-flex items-center justify-center rounded-full">
          {value}
        </span>
      </div>
      <div className="px-2 pb-2">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </Card>
  );
}

export default function PhoneAnalyticsPage() {
  return (
    <div className="gap-8 pb-8 flex flex-col">
      {/* Metric cards */}
      <div className="gap-4 flex">
        <MetricCard icon={ClockArrowUp} label="Total duration (mins)" value={1500} />
        <MetricCard icon={Clock9} label="Avg duration per call (mins)" value={4.35} />
      </div>

      {/* Charts */}
      <div className="gap-5 flex">
        <AgentCallActivityChart />
        <EscalationTrendChart />
      </div>
    </div>
  );
}
