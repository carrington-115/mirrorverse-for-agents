"use client";

import * as React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface SegmentData {
  label: string;
  value: number;
  color: string;
}

const DATA_BY_HOUR: Record<string, SegmentData[]> = {
  "11 AM": [
    { label: "Escalated calls", value: 20, color: "#a855f7" },
    { label: "Missed calls", value: 30, color: "#ef4444" },
    { label: "Answered calls", value: 70, color: "#16a34a" },
  ],
  "12 PM": [
    { label: "Escalated calls", value: 15, color: "#a855f7" },
    { label: "Missed calls", value: 22, color: "#ef4444" },
    { label: "Answered calls", value: 85, color: "#16a34a" },
  ],
  "1 PM": [
    { label: "Escalated calls", value: 28, color: "#a855f7" },
    { label: "Missed calls", value: 18, color: "#ef4444" },
    { label: "Answered calls", value: 60, color: "#16a34a" },
  ],
  "2 PM": [
    { label: "Escalated calls", value: 10, color: "#a855f7" },
    { label: "Missed calls", value: 40, color: "#ef4444" },
    { label: "Answered calls", value: 90, color: "#16a34a" },
  ],
};

function DonutCenterLabel({ viewBox, total }: { viewBox?: { cx: number; cy: number }; total: number }) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 26, fontWeight: 700, fill: "hsl(var(--foreground))" }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
      >
        Calls
      </text>
    </>
  );
}

function EscalationTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background shadow-lg p-2.5 flex items-center gap-3 min-w-[140px]">
      <div className="h-8 w-[3px] rounded-full shrink-0" style={{ backgroundColor: item.payload.color }} />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{item.payload.label}</span>
        <span className="text-xs font-semibold text-foreground">{item.value}</span>
      </div>
    </div>
  );
}

export default function EscalationTrendChart() {
  const [hour, setHour] = React.useState("11 AM");

  const chartData = DATA_BY_HOUR[hour] ?? DATA_BY_HOUR["11 AM"];
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-0 px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Escalation trend</span>
          </div>
          <Select value={hour} onValueChange={setHour}>
            <SelectTrigger className="h-8 w-[80px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(DATA_BY_HOUR).map((h) => (
                <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-4 flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={0}
              dataKey="value"
              labelLine={false}
              label={(props) => <DonutCenterLabel viewBox={props.viewBox} total={total} />}
            />
            <Tooltip content={<EscalationTooltip />} cursor={false} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
