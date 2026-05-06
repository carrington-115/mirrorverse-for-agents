"use client";

import { ClockArrowUp, Clock9 } from "lucide-react";
import { Card } from "@/components/ui/card";
import AgentCallActivityChart from "./AgentCallActivityChart";
import EscalationTrendChart from "./EscalationTrendChart";

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
}

function MetricCard({ icon: Icon, label, value }: MetricCardProps) {
  return (
    <Card className="w-[200px] shrink-0 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-between p-2">
        <Icon className="h-6 w-6 text-foreground" />
        <span className="inline-flex items-center justify-center rounded-full bg-green-700 px-2 py-0.5 text-xs font-semibold text-white">
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
    <div className="flex flex-col gap-8 pb-8">
      {/* Metric cards */}
      <div className="flex gap-4">
        <MetricCard icon={ClockArrowUp} label="Total duration (mins)" value={1500} />
        <MetricCard icon={Clock9} label="Avg duration per call (mins)" value={4.35} />
      </div>

      {/* Charts */}
      <div className="flex gap-5">
        <AgentCallActivityChart />
        <EscalationTrendChart />
      </div>
    </div>
  );
}
