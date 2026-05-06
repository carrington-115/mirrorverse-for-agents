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
import { Phone } from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface CallsDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface CallsChartProps {
  data?: CallsDataPoint[];
  granularityOptions?: string[];
  defaultGranularity?: string;
}

// ─────────────────────────────────────────
// DATA GENERATORS
// ─────────────────────────────────────────

export const generateHourlyCallsData = (): CallsDataPoint[] => [
  { label: "Outbound calls", value: 30, color: "#ea580c" },
  { label: "Inbound calls", value: 70, color: "#fb923c" },
  { label: "Missed calls", value: 62, color: "#fed7aa" },
];

export const generateDailyCallsData = (): CallsDataPoint[] => [
  { label: "Outbound calls", value: 120, color: "#ea580c" },
  { label: "Inbound calls", value: 280, color: "#fb923c" },
  { label: "Missed calls", value: 95, color: "#fed7aa" },
];

export const generateMonthlyCallsData = (): CallsDataPoint[] => [
  { label: "Outbound calls", value: 540, color: "#ea580c" },
  { label: "Inbound calls", value: 820, color: "#fb923c" },
  { label: "Missed calls", value: 310, color: "#fed7aa" },
];

const DATA_BY_GRANULARITY: Record<string, () => CallsDataPoint[]> = {
  "11 AM": generateHourlyCallsData,
  Today: generateDailyCallsData,
  "This Month": generateMonthlyCallsData,
};

// ─────────────────────────────────────────
// SUB-COMPONENT: Custom Tooltip
// ─────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  granularity?: string;
}

function CallsTooltip({ active, payload, granularity }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background shadow-lg p-2.5 min-w-[140px]">
      <p className="text-xs font-semibold text-foreground mb-1.5">
        {granularity}
      </p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-1 rounded-full"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="text-xs text-muted-foreground">
            {item.payload.label}
          </span>
        </div>
        <span className="text-xs font-bold text-foreground">{item.value}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: SVG Center Label
// ─────────────────────────────────────────

function DonutCenterLabel({
  viewBox,
  total,
}: {
  viewBox?: { cx: number; cy: number };
  total: number;
}) {
  const cx = viewBox?.cx ?? 0;
  const cy = viewBox?.cy ?? 0;
  return (
    <>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontSize: 26,
          fontWeight: 700,
          fill: "hsl(var(--foreground))",
        }}
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

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function CallsChart({
  data,
  granularityOptions = ["11 AM", "Today", "This Month"],
  defaultGranularity = "11 AM",
}: CallsChartProps) {
  const [granularity, setGranularity] = React.useState(defaultGranularity);

  const chartData = React.useMemo(() => {
    if (data) return data;
    return (DATA_BY_GRANULARITY[granularity] ?? generateHourlyCallsData)();
  }, [data, granularity]);

  const total = React.useMemo(
    () => chartData.reduce((sum, d) => sum + d.value, 0),
    [chartData],
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>Calls</span>
          </div>
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="h-8 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {granularityOptions.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="pt-2 pb-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={88}
              paddingAngle={3}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              // Render center label via labelList trick using a custom label on a zero-radius Pie
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} strokeWidth={0} />
              ))}
            </Pie>
            {/* Invisible Pie just to render the center SVG label */}
            <Pie
              data={[{ value: 1 }]}
              cx="50%"
              cy="50%"
              innerRadius={0}
              outerRadius={0}
              dataKey="value"
              labelLine={false}
              label={(props) => (
                <DonutCenterLabel viewBox={props.viewBox} total={total} />
              )}
            />
            <Tooltip
              content={<CallsTooltip granularity={granularity} />}
              cursor={false}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────
// <CallsChart />
// <CallsChart defaultGranularity="Today" />
// <CallsChart data={myData} />
