"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  ChevronDown,
  Pencil,
  Phone,
  Captions,
  BarChart2,
  Activity,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneNumber, CallLog } from "@/lib/types";
import CallLogsTable from "./call-logs-table";

interface PhoneDetailPageProps {
  phone: PhoneNumber;
  callLogs: CallLog[];
}

export default function PhoneDetailPage({ phone, callLogs }: PhoneDetailPageProps) {
  const router = useRouter();
  const [label, setLabel] = useState(phone.description);
  const [editingLabel, setEditingLabel] = useState(false);

  return (
    <div className="gap-4 flex w-full flex-col">
      {/* Back navigation */}
      <button
        onClick={() => router.back()}
        className="gap-1 text-sm flex w-fit items-center text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <div className="gap-2 flex flex-col">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="gap-2 flex flex-wrap items-center">
            <h1 className="text-2xl font-semibold tracking-[-1px] text-foreground">
              {phone.number}
            </h1>
            {phone.verificationStatus === "pending" ? (
              <Badge className="bg-yellow-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Pending verification
              </Badge>
            ) : (
              <Badge className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                Verified
              </Badge>
            )}
            <Badge className="bg-purple-500 text-white text-xs font-semibold px-2 py-0.5 gap-1 flex items-center rounded-full">
              <Bot className="size-3" />
              {phone.purpose}
            </Badge>
            <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5 rounded-full">
              {phone.callType}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="gap-3 flex shrink-0 items-center">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={() => toast.info("Verification coming soon")}
            >
              <Phone className="size-3.5" />
              Verification
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={() => toast.info("Test run coming soon")}
            >
              <Activity className="size-3.5" />
              Run test
            </Button>
          </div>
        </div>

        {/* Label row */}
        <div className="gap-2 flex items-center">
          {editingLabel ? (
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
              className="text-lg font-medium border-b border-border bg-transparent text-foreground outline-none"
            />
          ) : (
            <span className="text-lg font-medium text-foreground">{label}</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full bg-secondary hover:bg-secondary/80"
            onClick={() => setEditingLabel(true)}
          >
            <Pencil className="size-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="call-logs">
        <TabsList className="p-0.5 h-auto rounded-[10px] bg-accent">
          <TabsTrigger
            value="call-logs"
            className="gap-1.5 text-sm font-medium px-3 py-1.5 flex items-center rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <Phone className="size-4" />
            Call logs
          </TabsTrigger>
          <TabsTrigger
            value="transcripts"
            className="gap-1.5 text-sm font-medium px-3 py-1.5 flex items-center rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <Captions className="size-4" />
            Transcripts
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="gap-1.5 text-sm font-medium px-3 py-1.5 flex items-center rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <BarChart2 className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="gap-1.5 text-sm font-medium px-3 py-1.5 flex items-center rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none"
          >
            <Activity className="size-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="call-logs" className="mt-6">
          {callLogs.length > 0 ? (
            <CallLogsTable data={callLogs} />
          ) : (
            <EmptyTabState
              title="No calls yet"
              description="Once your phone numbers are added and agents are deployed, every inbound and outbound call will be logged here"
            />
          )}
        </TabsContent>

        <TabsContent value="transcripts" className="mt-6">
          <EmptyTabState
            title="No transcripts yet"
            description="Call transcripts will appear here once calls have been made through this number"
          />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <EmptyTabState
            title="No analytics yet"
            description="Call analytics and performance metrics will appear here once calls are logged"
          />
        </TabsContent>

        <TabsContent value="usage" className="mt-6">
          <EmptyTabState
            title="No usage data yet"
            description="Usage statistics for this number will appear here once calls begin"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyTabState({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-4 flex w-full items-center justify-center">
      <div className="px-8 py-8 gap-4 flex min-h-[277px] w-[448px] flex-col items-center justify-center rounded-xl border border-border">
        <div className="gap-1 flex flex-col text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="gap-2 flex items-center">
          <Button size="sm" onClick={() => toast.info("Test run coming soon")} className="gap-1.5">
            <Activity className="size-3.5" />
            Run test
          </Button>
          <Button size="sm" variant="outline" onClick={() => toast.info("Edit coming soon")}>
            Edit details
          </Button>
        </div>
      </div>
    </div>
  );
}
