"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────

export type ActivityIndicatorColor = "green" | "blue" | "orange";

export interface ActivityMetric {
  label: string;
  value: number;
  color: ActivityIndicatorColor;
}

export interface TeamMember {
  name: string;
  imageUrl?: string;
  fallback: string;
}

export interface CurrentActivityProps {
  metrics?: ActivityMetric[];
  teamMembers?: TeamMember[];
  extraMembersCount?: number;
}

// ─────────────────────────────────────────
// TEST DATA
// ─────────────────────────────────────────

export const testMetrics: ActivityMetric[] = [
  { label: "Active agents", value: 12, color: "green" },
  { label: "Ongoing calls", value: 50, color: "blue" },
  { label: "Ongoing Chats", value: 22, color: "blue" },
  { label: "Active experiments", value: 5, color: "green" },
];

export const testTeamMembers: TeamMember[] = [
  { name: "Alice", imageUrl: "https://github.com/shadcn.png", fallback: "AL" },
  { name: "Carlos", imageUrl: undefined, fallback: "C" },
  { name: "Nina", imageUrl: "https://github.com/maxleiter.png", fallback: "N" },
];

// ─────────────────────────────────────────
// SUB-COMPONENT: Indicator Dot
// ─────────────────────────────────────────

const DOT_STYLES: Record<ActivityIndicatorColor, string> = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
};

function IndicatorDot({ color }: { color: ActivityIndicatorColor }) {
  return <span className={cn("h-2 w-2 inline-block shrink-0 rounded-full", DOT_STYLES[color])} />;
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Activity Count Badge
// ─────────────────────────────────────────

const BADGE_STYLES: Record<ActivityIndicatorColor, string> = {
  green: "bg-green-500 text-white hover:bg-green-500",
  blue: "bg-blue-500  text-white hover:bg-blue-500",
  orange: "bg-orange-500 text-white hover:bg-orange-500",
};

function ActivityBadge({ value, color }: { value: number; color: ActivityIndicatorColor }) {
  return (
    <Badge
      className={cn(
        "px-2 py-0.5 text-xs font-semibold min-w-[28px] justify-center rounded-full border-0",
        BADGE_STYLES[color],
      )}
    >
      {value}
    </Badge>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Metric Row
// ─────────────────────────────────────────

function MetricRow({ metric }: { metric: ActivityMetric }) {
  return (
    <div className="px-3 py-2.5 flex items-center justify-between rounded-lg border border-border">
      <div className="gap-2.5 flex items-center">
        <IndicatorDot color={metric.color} />
        <span className="text-sm text-foreground">{metric.label}</span>
      </div>
      <ActivityBadge value={metric.value} color={metric.color} />
    </div>
  );
}

// ─────────────────────────────────────────
// SUB-COMPONENT: Team Members Row
// ─────────────────────────────────────────

function TeamMembersRow({ members, extraCount }: { members: TeamMember[]; extraCount: number }) {
  return (
    <div className="px-3 py-2 flex items-center justify-between rounded-lg border border-border">
      <span className="text-sm text-foreground">Team members</span>
      <div className="-space-x-2 flex items-center">
        {members.map((member) => (
          <Avatar key={member.name} className="h-7 w-7 border-2 border-background">
            {member.imageUrl && <AvatarImage src={member.imageUrl} alt={member.name} />}
            <AvatarFallback className="font-medium bg-muted text-[10px]">
              {member.fallback}
            </AvatarFallback>
          </Avatar>
        ))}
        {extraCount > 0 && (
          <div className="h-7 w-7 font-semibold z-10 flex items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">
            {extraCount}+
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────

export default function CurrentActivityCard({
  metrics = testMetrics,
  teamMembers = testTeamMembers,
  extraMembersCount = 5,
}: CurrentActivityProps) {
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Monitor className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Current activity</span>
        </div>
      </CardHeader>
      <CardContent className="gap-2 flex flex-col">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} metric={metric} />
        ))}
        <TeamMembersRow members={teamMembers} extraCount={extraMembersCount} />
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────
// USAGE
// ─────────────────────────────────────────
// <CurrentActivityCard />
// <CurrentActivityCard metrics={myMetrics} teamMembers={myTeam} extraMembersCount={3} />
