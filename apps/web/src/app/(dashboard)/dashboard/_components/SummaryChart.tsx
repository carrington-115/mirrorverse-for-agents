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
import { ChartLine, Mail, Phone, Users } from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface ChartDataPoint {
  label: string;
  emailsSent: number;
  calls: number;
  agents: number;
}

export interface SummaryChartProps {
  data?: ChartDataPoint[];
  title?: string;
  filterOptions?: string[];
  granularityOptions?: string[];
  defaultFilter?: string;
  defaultGranularity?: string;
}

// ─────────────────────────────────────────
// TEST DATA GENERATORS
// You can swap these to change the chart visualization
// ─────────────────────────────────────────

// Strategy 1: Smooth seasonal wave data (default)
export const generateSeasonalData = (): ChartDataPoint[] => {
  const months = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  return months.map((month, i) => ({
    label: month,
    emailsSent: Math.round(200 + Math.sin(i / 2) * 120 + Math.random() * 80),
    calls: Math.round(
      100 + Math.abs(Math.sin(i * 1.5)) * 250 + Math.random() * 100,
    ),
    agents: Math.round(80 + Math.cos(i / 1.5) * 40 + Math.random() * 40),
  }));
};

// Strategy 2: Weekly granularity — more data points, spikier
export const generateWeeklyData = (): ChartDataPoint[] => {
  return Array.from({ length: 52 }, (_, i) => ({
    label: `W${i + 1}`,
    emailsSent: Math.round(150 + Math.sin(i / 4) * 100 + Math.random() * 60),
    calls: Math.round(
      80 + Math.abs(Math.sin(i * 2)) * 200 + Math.random() * 80,
    ),
    agents: Math.round(60 + Math.cos(i / 3) * 30 + Math.random() * 30),
  }));
};

// Strategy 3: Quarterly — minimal points, high contrast
export const generateQuarterlyData = (): ChartDataPoint[] => [
  { label: "Q1", emailsSent: 320, calls: 410, agents: 180 },
  { label: "Q2", emailsSent: 480, calls: 290, agents: 210 },
  { label: "Q3", emailsSent: 390, calls: 520, agents: 160 },
  { label: "Q4", emailsSent: 560, calls: 380, agents: 240 },
];

// Strategy 4: Daily this week
export const generateDailyData = (): ChartDataPoint[] => {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    label: day,
    emailsSent: Math.round(100 + Math.random() * 300),
    calls: Math.round(50 + Math.random() * 400),
    agents: Math.round(40 + Math.random() * 150),
  }));
};

const DATA_BY_GRANULARITY: Record<string, () => ChartDataPoint[]> = {
  Day: generateDailyData,
  Week: generateWeeklyData,
  Month: generateSeasonalData,
  Quarter: generateQuarterlyData,
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
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <ChartLine className="h-4 w-4 text-muted-foreground" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="h-8 w-[90px] text-xs">
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
          <SelectTrigger className="h-8 w-[100px] text-xs">
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

  const emailsSent = payload.find((p) => p.dataKey === "emailsSent")?.value;
  const calls = payload.find((p) => p.dataKey === "calls")?.value;
  const agents = payload.find((p) => p.dataKey === "agents")?.value;

  return (
    <div className="rounded-lg border border-border bg-background shadow-lg p-3 min-w-[160px]">
      <p className="text-xs font-semibold text-foreground mb-2 capitalize">
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-[#4ade80]" />
            <span className="text-xs text-muted-foreground">Emails sent</span>
          </div>
          <span className="text-xs font-bold text-foreground">
            {emailsSent}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-[#f97316]" />
            <span className="text-xs text-muted-foreground">Calls</span>
          </div>
          <span className="text-xs font-bold text-foreground">{calls}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-[#60a5fa]" />
            <span className="text-xs text-muted-foreground">Agents</span>
          </div>
          <span className="text-xs font-bold text-foreground">{agents}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Chart Area
// ─────────────────────────────────────────

interface ChartAreaProps {
  data: ChartDataPoint[];
  activeIndex: number | null;
}

function ChartArea({ data, activeIndex }: ChartAreaProps) {
  const activeLabel =
    activeIndex !== null ? data[activeIndex]?.label : undefined;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart
        data={data}
        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
      >
        <defs>
          {/* Green gradient — Emails sent */}
          <linearGradient id="gradEmailsSent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#4ade80" stopOpacity={0.05} />
          </linearGradient>
          {/* Orange gradient — Calls */}
          <linearGradient id="gradCalls" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f97316" stopOpacity={0.7} />
            <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
          </linearGradient>
          {/* Blue gradient — Agents */}
          <linearGradient id="gradAgents" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.5} />
            <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
          </linearGradient>
        </defs>

        <CartesianGrid
          vertical={false}
          stroke="hsl(var(--border))"
          strokeOpacity={0.5}
        />

        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          tickMargin={8}
        />

        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          width={40}
        />

        <Tooltip
          content={<CustomTooltip />}
          cursor={false} // we draw our own reference line
        />

        {/* Active vertical reference line */}
        {activeLabel && (
          <ReferenceLine
            x={activeLabel}
            stroke="hsl(var(--foreground))"
            strokeWidth={1}
            strokeDasharray="0"
          />
        )}

        {/* Green — Emails sent (bottom layer, widest) */}
        <Area
          type="monotone"
          dataKey="emailsSent"
          stroke="#4ade80"
          strokeWidth={1.5}
          fill="url(#gradEmailsSent)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "#4ade80" }}
        />

        {/* Orange — Calls (middle layer, spiky) */}
        <Area
          type="monotone"
          dataKey="calls"
          stroke="#f97316"
          strokeWidth={1.5}
          fill="url(#gradCalls)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "#f97316" }}
        />

        {/* Blue — Agents (top layer, wavy baseline) */}
        <Area
          type="monotone"
          dataKey="agents"
          stroke="#60a5fa"
          strokeWidth={1.5}
          fill="url(#gradAgents)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0, fill: "#60a5fa" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Chart Legend
// ─────────────────────────────────────────

function ChartLegend() {
  const items = [
    { label: "Emails sent", color: "#4ade80" },
    { label: "Calls", color: "#f97316" },
    { label: "Agents", color: "#60a5fa" },
  ];

  return (
    <div className="flex items-center justify-center gap-6 pt-1">
      {items.map(({ label, color }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center size-2 rounded-sm p-0.5"
            style={{ backgroundColor: `${color}` }}
          />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT: SummaryChart
// ─────────────────────────────────────────

export default function SummaryChart({
  data,
  title = "Summary of emails sent, calls, and agents",
  filterOptions = ["All", "Emails", "Calls", "Agents"],
  granularityOptions = ["Day", "Week", "Month", "Quarter"],
  defaultFilter = "All",
  defaultGranularity = "Month",
}: SummaryChartProps) {
  const [filter, setFilter] = React.useState(defaultFilter);
  const [granularity, setGranularity] = React.useState(defaultGranularity);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // If data is passed as prop, use it. Otherwise generate from granularity.
  const chartData = React.useMemo(() => {
    if (data) return data;
    const generator = DATA_BY_GRANULARITY[granularity] ?? generateSeasonalData;
    return generator();
  }, [data, granularity]);

  // Filter which series are visible
  const visibleData = React.useMemo(() => {
    if (filter === "All") return chartData;
    return chartData.map((point) => ({
      ...point,
      emailsSent: filter === "Emails" ? point.emailsSent : 0,
      calls: filter === "Calls" ? point.calls : 0,
      agents: filter === "Agents" ? point.agents : 0,
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
            setActiveIndex(null);
          }}
        />
      </CardHeader>
      <CardContent className="pb-4">
        <div
          onMouseLeave={() => setActiveIndex(null)}
          onMouseMove={(e) => {
            // Track active index via recharts internal — handled via Tooltip
          }}
        >
          <ChartArea data={visibleData} activeIndex={activeIndex} />
        </div>
        <ChartLegend />
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// USAGE EXAMPLES (for reference)
// ─────────────────────────────────────────
//
// 1. Default — auto-generates monthly data:
//    <SummaryChart />
//
// 2. Pass custom data:
//    <SummaryChart data={myData} />
//
// 3. Lock to quarterly view:
//    <SummaryChart defaultGranularity="Quarter" />
//
// 4. Custom title and filter options:
//    <SummaryChart
//      title="Agent activity summary"
//      filterOptions={["All", "Agents"]}
//      granularityOptions={["Day", "Week"]}
//    />
