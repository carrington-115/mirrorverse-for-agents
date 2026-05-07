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
import { MessageCircle } from "lucide-react";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export interface ChatsDataPoint {
  label: string;
  value: number;
  color: string;
}

export interface ChatsChartProps {
  data?: ChatsDataPoint[];
  granularityOptions?: string[];
  defaultGranularity?: string;
}

// ─────────────────────────────────────────
// DATA GENERATORS
// ─────────────────────────────────────────

export const generateFebruaryChatsData = (): ChatsDataPoint[] => [
  { label: "WhatsApp", value: 125, color: "#0d9488" }, // teal
  { label: "SMS", value: 320, color: "#f97316" }, // orange
  { label: "Telegram", value: 200, color: "#6366f1" }, // indigo
  { label: "Messenger", value: 480, color: "#eab308" }, // yellow
];

export const generateJanuaryChatsData = (): ChatsDataPoint[] => [
  { label: "WhatsApp", value: 98, color: "#0d9488" },
  { label: "SMS", value: 260, color: "#f97316" },
  { label: "Telegram", value: 145, color: "#6366f1" },
  { label: "Messenger", value: 390, color: "#eab308" },
];

export const generateMarchChatsData = (): ChatsDataPoint[] => [
  { label: "WhatsApp", value: 210, color: "#0d9488" },
  { label: "SMS", value: 410, color: "#f97316" },
  { label: "Telegram", value: 175, color: "#6366f1" },
  { label: "Messenger", value: 530, color: "#eab308" },
];

const DATA_BY_GRANULARITY: Record<string, () => ChatsDataPoint[]> = {
  February: generateFebruaryChatsData,
  January: generateJanuaryChatsData,
  March: generateMarchChatsData,
};

// ─────────────────────────────────────────
// SUB-COMPONENT: Custom Tooltip
// ─────────────────────────────────────────

interface TooltipProps {
  active?: boolean;
  payload?: any[];
}

function ChatsTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="shadow-lg p-2.5 min-w-[130px] rounded-lg border border-border bg-background">
      <div className="gap-4 flex items-center justify-between">
        <div className="gap-1.5 flex items-center">
          <span
            className="h-2.5 w-2.5 inline-block rounded-full"
            style={{ backgroundColor: item.payload.color }}
          />
          <span className="text-xs text-muted-foreground">{item.payload.label}</span>
        </div>
        <span className="text-xs font-bold text-foreground">{item.value}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Donut Center Label
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
          fontSize: 24,
          fontWeight: 700,
          fill: "hsl(var(--foreground))",
        }}
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 15}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
      >
        Chats
      </text>
    </>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Side Legend
// ─────────────────────────────────────────

interface SideLegendProps {
  data: ChatsDataPoint[];
  granularity: string;
}

function SideLegend({ data, granularity }: SideLegendProps) {
  return (
    <div className="gap-1.5 flex min-w-[130px] flex-col">
      <p className="text-xs font-semibold mb-1 text-foreground">{granularity}</p>
      {data.map(({ label, value, color }) => (
        <div key={label} className="gap-3 flex items-center justify-between">
          <div className="gap-1.5 flex items-center">
            <span
              className="h-2.5 w-1 inline-block shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <span className="text-xs font-semibold text-foreground">{value}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function ChatsChart({
  data,
  granularityOptions = ["February", "January", "March"],
  defaultGranularity = "February",
}: ChatsChartProps) {
  const [granularity, setGranularity] = React.useState(defaultGranularity);

  const chartData = React.useMemo(() => {
    if (data) return data;
    return (DATA_BY_GRANULARITY[granularity] ?? generateFebruaryChatsData)();
  }, [data, granularity]);

  const total = React.useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData]);

  return (
    <Card className="w-full">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="gap-2 text-sm font-medium flex items-center">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span>Chats</span>
          </div>
          <Select value={granularity} onValueChange={setGranularity}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
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
        <div className="gap-4 flex items-center justify-between">
          {/* Donut chart */}
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                {/* Center label via zero-radius Pie */}
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
                <Tooltip content={<ChatsTooltip />} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Side legend */}
          <SideLegend data={chartData} granularity={granularity} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────
// <ChatsChart />
// <ChatsChart defaultGranularity="January" />
// <ChatsChart data={myData} />
