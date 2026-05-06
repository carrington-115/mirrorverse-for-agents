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
import { Send } from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface EmailsDataPoint {
  label: string;
  emails: number;
}

export interface EmailsChartProps {
  data?: EmailsDataPoint[];
  granularityOptions?: string[];
  defaultGranularity?: string;
}

// ─────────────────────────────────────────
// DATA GENERATORS
// ─────────────────────────────────────────

export const generateMonthlyEmailsData = (): EmailsDataPoint[] => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months.map((label, i) => ({
    label,
    emails: Math.round(30 + Math.sin(i / 2) * 25 + Math.random() * 15),
  }));
};

export const generateWeeklyEmailsData = (): EmailsDataPoint[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    label: `W${i + 1}`,
    emails: Math.round(20 + Math.sin(i / 1.5) * 18 + Math.random() * 10),
  }));
};

export const generateDailyEmailsData = (): EmailsDataPoint[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((label) => ({
    label,
    emails: Math.round(10 + Math.random() * 60),
  }));
};

export const generateQuarterlyEmailsData = (): EmailsDataPoint[] => [
  { label: "Q1", emails: 320 },
  { label: "Q2", emails: 480 },
  { label: "Q3", emails: 290 },
  { label: "Q4", emails: 540 },
];

const DATA_BY_GRANULARITY: Record<string, () => EmailsDataPoint[]> = {
  Months: generateMonthlyEmailsData,
  Weeks: generateWeeklyEmailsData,
  Days: generateDailyEmailsData,
  Quarters: generateQuarterlyEmailsData,
};

// ─────────────────────────────────────────
// SUB-COMPONENT: Custom Tooltip
// ─────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function EmailsTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background shadow-md px-3 py-2 flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[#818cf8]" />
        <span className="text-xs text-muted-foreground">Emails</span>
      </div>
      <span className="text-xs font-bold text-foreground">
        {payload[0].value}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function EmailsChart({
  data,
  granularityOptions = ["Months", "Weeks", "Days", "Quarters"],
  defaultGranularity = "Months",
}: EmailsChartProps) {
  const [granularity, setGranularity] = React.useState(defaultGranularity);
  const [activeLabel, setActiveLabel] = React.useState<string | null>(null);

  const chartData = React.useMemo(() => {
    if (data) return data;
    return (DATA_BY_GRANULARITY[granularity] ?? generateMonthlyEmailsData)();
  }, [data, granularity]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Send className="h-4 w-4 text-muted-foreground" />
            <span>Emails</span>
          </div>
          <Select
            value={granularity}
            onValueChange={(val) => {
              setGranularity(val);
              setActiveLabel(null);
            }}
          >
            <SelectTrigger className="h-8 w-[110px] text-xs">
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
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 0, left: -30, bottom: 0 }}
            onMouseMove={(e) => {
              if (e.activeLabel) setActiveLabel(e.activeLabel);
            }}
            onMouseLeave={() => setActiveLabel(null)}
          >
            <defs>
              <linearGradient id="gradEmails" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid
              vertical={false}
              stroke="hsl(var(--border))"
              strokeOpacity={0.4}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickMargin={8}
            />
            <YAxis hide />

            <Tooltip content={<EmailsTooltip />} cursor={false} />

            {activeLabel && (
              <ReferenceLine
                x={activeLabel}
                stroke="hsl(var(--foreground))"
                strokeWidth={1}
              />
            )}

            <Area
              type="monotone"
              dataKey="emails"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#gradEmails)"
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: "#818cf8",
                fill: "hsl(var(--background))",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────
// <EmailsChart />
// <EmailsChart defaultGranularity="Weeks" />
// <EmailsChart data={myData} />
