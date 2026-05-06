"use client";

import * as React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Phone } from "lucide-react";

interface DataPoint {
  label: string;
  calls: number;
}

const generateMonthlyData = (): DataPoint[] => {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((label, i) => ({
    label,
    calls: Math.round(40 + Math.sin(i / 1.8) * 35 + Math.sin(i / 0.9) * 15),
  }));
};

const generateWeeklyData = (): DataPoint[] =>
  Array.from({ length: 12 }, (_, i) => ({
    label: `W${i + 1}`,
    calls: Math.round(25 + Math.sin(i / 1.5) * 22 + Math.sin(i / 0.7) * 10),
  }));

const generateDailyData = (): DataPoint[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((label, i) => ({
    label,
    calls: Math.round(15 + Math.sin(i / 1.2) * 28 + Math.sin(i / 0.6) * 12),
  }));
};

const DATA_BY_GRANULARITY: Record<string, () => DataPoint[]> = {
  Months: generateMonthlyData,
  Weeks: generateWeeklyData,
  Days: generateDailyData,
};

function ActivityTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background shadow-md px-3 py-2 flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#818cf8]" />
        <span className="text-xs text-muted-foreground">Calls</span>
      </div>
      <span className="text-xs font-bold text-foreground">{payload[0].value}</span>
    </div>
  );
}

export default function AgentCallActivityChart() {
  const [granularity, setGranularity] = React.useState("Months");
  const [activeLabel, setActiveLabel] = React.useState<string | null>(null);

  const chartData = React.useMemo(
    () => (DATA_BY_GRANULARITY[granularity] ?? generateMonthlyData)(),
    [granularity],
  );

  return (
    <Card className="flex-[2] min-w-0">
      <CardHeader className="pb-0 px-4 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Agent call activity</span>
          </div>
          <Select value={granularity} onValueChange={(v) => { setGranularity(v); setActiveLabel(null); }}>
            <SelectTrigger className="h-8 w-[100px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Months", "Weeks", "Days"].map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-4 px-4">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
            onMouseMove={(e) => { if (e.activeLabel) setActiveLabel(e.activeLabel); }}
            onMouseLeave={() => setActiveLabel(null)}
          >
            <defs>
              <linearGradient id="gradCallActivity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.4} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickMargin={8}
            />
            <YAxis hide />
            <Tooltip content={<ActivityTooltip />} cursor={false} />
            {activeLabel && (
              <ReferenceLine x={activeLabel} stroke="hsl(var(--foreground))" strokeWidth={1} />
            )}
            <Area
              type="monotone"
              dataKey="calls"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#gradCallActivity)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#818cf8", fill: "hsl(var(--background))" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
