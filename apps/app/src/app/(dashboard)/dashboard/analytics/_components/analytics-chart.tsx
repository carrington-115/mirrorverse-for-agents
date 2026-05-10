"use client";

import * as React from "react";
import {
  LineChart,
  Line,
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
import { ChartLine } from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface ConversationRateDataPoint {
  label: string;
  avgSuccessRate: number; // percentage 0–100
  avgConversationRate: number; // raw count
}

// Looser type used internally for filtered/display data passed to ChartLines
// Fields are optional so either line can be hidden by the filter
export interface ChartDisplayPoint {
  label: string;
  avgSuccessRate?: number | undefined;
  avgConversationRate?: number | undefined;
}

export interface ConversationRateChartProps {
  data?: ConversationRateDataPoint[];
  title?: string;
  filterOptions?: string[];
  granularityOptions?: string[];
  defaultFilter?: string;
  defaultGranularity?: string;
}

// ─────────────────────────────────────────
// DATA GENERATORS
// Each strategy produces a different visual shape
// ─────────────────────────────────────────

// Strategy 1: Hourly — smooth opposing sine waves (matches the design)
export const generateHourlyData = (): ConversationRateDataPoint[] => {
  const hours = [
    "6 AM",
    "7 AM",
    "8 AM",
    "9 AM",
    "10 AM",
    "11 AM",
    "12 AM",
    "1 PM",
    "2 PM",
    "3 PM",
    "4 PM",
    "5 PM",
  ];
  return hours.map((label, i) => ({
    label,
    avgSuccessRate: Math.round(50 + Math.sin((i / (hours.length - 1)) * Math.PI * 2.5) * 40),
    avgConversationRate: Math.round(
      50 + Math.sin((i / (hours.length - 1)) * Math.PI * 2.5 + Math.PI) * 30,
    ),
  }));
};

// Strategy 2: Daily — weekly pattern
export const generateDailyData = (): ConversationRateDataPoint[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((label, i) => ({
    label,
    avgSuccessRate: Math.round(60 + Math.sin(i * 0.9) * 30 + Math.random() * 10),
    avgConversationRate: Math.round(40 + Math.cos(i * 0.9) * 25 + Math.random() * 10),
  }));
};

// Strategy 3: Monthly — yearly trend
export const generateMonthlyData = (): ConversationRateDataPoint[] => {
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
    avgSuccessRate: Math.round(55 + Math.sin(i / 2) * 35),
    avgConversationRate: Math.round(45 + Math.cos(i / 2) * 28),
  }));
};

// Strategy 4: Quarterly
export const generateQuarterlyData = (): ConversationRateDataPoint[] => [
  { label: "Q1", avgSuccessRate: 72, avgConversationRate: 38 },
  { label: "Q2", avgSuccessRate: 45, avgConversationRate: 61 },
  { label: "Q3", avgSuccessRate: 83, avgConversationRate: 29 },
  { label: "Q4", avgSuccessRate: 51, avgConversationRate: 74 },
];

const DATA_BY_GRANULARITY: Record<string, () => ConversationRateDataPoint[]> = {
  Hours: generateHourlyData,
  Days: generateDailyData,
  Months: generateMonthlyData,
  Quarters: generateQuarterlyData,
};

// ─────────────────────────────────────────
// SUB-COMPONENT: Chart Header
// ─────────────────────────────────────────

interface ChartHeaderProps {
  title: string;
  filterOptions: string[];
  granularityOptions: string[];
  filter: string;
  granularity: string;
  onFilterChange: (value: string) => void;
  onGranularityChange: (value: string) => void;
}

function ChartHeader({
  title,
  filterOptions,
  granularityOptions,
  filter,
  granularity,
  onFilterChange,
  onGranularityChange,
}: ChartHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="gap-2 text-sm font-medium flex items-center text-foreground">
        <ChartLine className="h-4 w-4 text-muted-foreground" />
        <span>{title}</span>
      </div>
      <div className="gap-2 flex items-center">
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="h-8 text-xs w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filterOptions.map((opt) => (
              <SelectItem key={opt} value={opt} className="text-xs">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={granularity} onValueChange={onGranularityChange}>
          <SelectTrigger className="h-8 text-xs w-[110px]">
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
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Custom Tooltip
// ─────────────────────────────────────────

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const successRate = payload.find((p) => p.dataKey === "avgSuccessRate")?.value;
  const conversationRate = payload.find((p) => p.dataKey === "avgConversationRate")?.value;

  return (
    <div className="shadow-lg p-3 min-w-[180px] rounded-lg border border-border bg-background">
      <p className="text-xs font-semibold mb-2 text-foreground">{label}</p>
      <div className="gap-1.5 flex flex-col">
        <div className="gap-6 flex items-center justify-between">
          <div className="gap-1.5 flex items-center">
            {/* Green dot */}
            <span className="h-2.5 w-2.5 inline-block rounded-full bg-[#22c55e]" />
            <span className="text-xs max-w-[90px] truncate text-muted-foreground">
              Avg Succes...
            </span>
          </div>
          <span className="text-xs font-bold text-foreground">{successRate}%</span>
        </div>
        <div className="gap-6 flex items-center justify-between">
          <div className="gap-1.5 flex items-center">
            {/* Purple dot */}
            <span className="h-2.5 w-2.5 inline-block rounded-full bg-[#a855f7]" />
            <span className="text-xs max-w-[90px] truncate text-muted-foreground">
              Avg conversa...
            </span>
          </div>
          <span className="text-xs font-bold text-foreground">{conversationRate}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Chart Lines
// ─────────────────────────────────────────

interface ChartLinesProps {
  data: ChartDisplayPoint[]; // ← accepts optional fields from filtered data
  activeLabel: string | null;
}

function ChartLines({ data, activeLabel }: ChartLinesProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickMargin={10}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} cursor={false} />

        {/* Active vertical reference line on hover */}
        {activeLabel && (
          <ReferenceLine x={activeLabel} stroke="hsl(var(--foreground))" strokeWidth={1} />
        )}

        {/* Green — Average success rate */}
        <Line
          type="monotone"
          dataKey="avgSuccessRate"
          stroke="#22c55e"
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 5,
            strokeWidth: 2,
            stroke: "#22c55e",
            fill: "hsl(var(--background))",
          }}
        />

        {/* Purple — Average conversation rate */}
        <Line
          type="monotone"
          dataKey="avgConversationRate"
          stroke="#a855f7"
          strokeWidth={2}
          dot={false}
          activeDot={{
            r: 5,
            strokeWidth: 2,
            stroke: "#a855f7",
            fill: "hsl(var(--background))",
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Legend
// ─────────────────────────────────────────

function ChartLegend() {
  const items = [
    { label: "Average conversation rate", color: "#a855f7" },
    { label: "Average success rate", color: "#22c55e" },
  ];

  return (
    <div className="gap-6 pt-1 flex items-center justify-center">
      {items.map(({ label, color }) => (
        <div key={label} className="gap-1.5 flex items-center">
          <span
            className="h-2.5 w-2.5 inline-block rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: ConversationRateChart
// ─────────────────────────────────────────

export default function AnalyticsChart({
  data,
  title = "Conversation and Success rate",
  filterOptions = ["All", "Success", "Conversation"],
  granularityOptions = ["Hours", "Days", "Months", "Quarters"],
  defaultFilter = "All",
  defaultGranularity = "Hours",
}: ConversationRateChartProps) {
  const [filter, setFilter] = React.useState(defaultFilter);
  const [granularity, setGranularity] = React.useState(defaultGranularity);
  const [activeLabel, setActiveLabel] = React.useState<string | null>(null);

  const chartData = React.useMemo(() => {
    if (data) return data;
    const generator = DATA_BY_GRANULARITY[granularity] ?? generateHourlyData;
    return generator();
  }, [data, granularity]);

  // Filter which lines are visible — returns ChartDisplayPoint[] with optional fields
  const visibleData: ChartDisplayPoint[] = React.useMemo(() => {
    if (filter === "All") return chartData;
    return chartData.map((point) => ({
      label: point.label,
      avgSuccessRate: filter === "Success" ? point.avgSuccessRate : undefined,
      avgConversationRate: filter === "Conversation" ? point.avgConversationRate : undefined,
    }));
  }, [chartData, filter]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <ChartHeader
          title={title}
          filterOptions={filterOptions}
          granularityOptions={granularityOptions}
          filter={filter}
          granularity={granularity}
          onFilterChange={setFilter}
          onGranularityChange={(val) => {
            setGranularity(val);
            setActiveLabel(null);
          }}
        />
      </CardHeader>
      <CardContent className="pb-4">
        <div
          onMouseLeave={() => setActiveLabel(null)}
          onMouseMove={(_e: React.MouseEvent) => {
            // activeLabel is updated via Tooltip's onValueChange
          }}
        >
          <ChartLines data={visibleData} activeLabel={activeLabel} />
        </div>
        <ChartLegend />
      </CardContent>
    </Card>
  );
}
