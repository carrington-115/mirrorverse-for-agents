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
import CallLogsTable from "./CallLogsTable";

interface PhoneDetailPageProps {
  phone: PhoneNumber;
  callLogs: CallLog[];
}

export default function PhoneDetailPage({ phone, callLogs }: PhoneDetailPageProps) {
  const router = useRouter();
  const [label, setLabel] = useState(phone.description);
  const [editingLabel, setEditingLabel] = useState(false);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Back navigation */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ChevronLeft className="size-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-[-1px] text-foreground">
              {phone.number}
            </h1>
            {phone.verificationStatus === "pending" ? (
              <Badge className="bg-yellow-500 text-white rounded-full text-xs font-semibold px-2 py-0.5">
                Pending verification
              </Badge>
            ) : (
              <Badge className="bg-green-500 text-white rounded-full text-xs font-semibold px-2 py-0.5">
                Verified
              </Badge>
            )}
            <Badge className="bg-purple-500 text-white rounded-full text-xs font-semibold px-2 py-0.5 flex items-center gap-1">
              <Bot className="size-3" />
              {phone.purpose}
            </Badge>
            <Badge
              variant="outline"
              className="rounded-full text-xs font-semibold px-2 py-0.5"
            >
              {phone.callType}
            </Badge>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={() => toast.info("Verification coming soon")}
            >
              <Phone className="size-3.5" />
              Verification
              <ChevronDown className="size-3.5" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={() => toast.info("Test run coming soon")}
            >
              <Activity className="size-3.5" />
              Run test
            </Button>
          </div>
        </div>

        {/* Label row */}
        <div className="flex items-center gap-2">
          {editingLabel ? (
            <input
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onBlur={() => setEditingLabel(false)}
              onKeyDown={(e) => e.key === "Enter" && setEditingLabel(false)}
              className="text-lg font-medium text-foreground border-b border-border bg-transparent outline-none"
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
        <TabsList className="bg-accent p-0.5 rounded-[10px] h-auto">
          <TabsTrigger
            value="call-logs"
            className="flex items-center gap-1.5 rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none text-sm font-medium px-3 py-1.5"
          >
            <Phone className="size-4" />
            Call logs
          </TabsTrigger>
          <TabsTrigger
            value="transcripts"
            className="flex items-center gap-1.5 rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none text-sm font-medium px-3 py-1.5"
          >
            <Captions className="size-4" />
            Transcripts
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center gap-1.5 rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none text-sm font-medium px-3 py-1.5"
          >
            <BarChart2 className="size-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger
            value="usage"
            className="flex items-center gap-1.5 rounded-[10px] data-[state=active]:bg-background data-[state=active]:shadow-none text-sm font-medium px-3 py-1.5"
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

function EmptyTabState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex w-full items-center justify-center py-4">
      <div className="border border-border rounded-xl w-[448px] min-h-[277px] px-8 py-8 flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-1 text-center">
          <p className="text-base font-medium text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => toast.info("Test run coming soon")}
            className="gap-1.5"
          >
            <Activity className="size-3.5" />
            Run test
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast.info("Edit coming soon")}
          >
            Edit details
          </Button>
        </div>
      </div>
    </div>
  );
}
