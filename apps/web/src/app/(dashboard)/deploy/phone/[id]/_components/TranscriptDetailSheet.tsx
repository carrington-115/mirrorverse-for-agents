"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Play, Pause, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Transcript } from "@/lib/types";

const TAG_STYLES: Record<string, string> = {
  "Call escalated": "bg-foreground text-background",
  "Human handoff": "bg-amber-500 text-white",
  Resolved: "bg-green-500 text-white",
};

function formatDurationFromSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function StaticWaveformLarge() {
  const bars = [
    8, 18, 28, 22, 38, 48, 36, 24, 42, 56, 50, 44, 32, 22, 12, 30, 48, 40, 26,
    16, 8, 18, 28, 22, 38, 48, 36, 24, 42, 56, 50, 44, 32, 22, 12, 30, 48, 40,
    26, 16, 8, 18, 28, 22, 38, 48, 36, 24, 42, 56, 50, 44, 32, 22, 12, 30, 48,
    40, 26, 16,
  ];
  return (
    <div className="flex items-center gap-[3px] h-[72px] flex-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full w-[3px] shrink-0"
          style={{
            height: `${h}px`,
            backgroundColor: i < bars.length * 0.3 ? "#171717" : "#d4d4d4",
          }}
        />
      ))}
    </div>
  );
}

function AudioWaveformLarge({
  audioUrl,
  isPlaying,
  onTimeUpdate,
}: {
  audioUrl: string;
  isPlaying: boolean;
  onTimeUpdate: (seconds: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: "#d4d4d4",
    progressColor: "#171717",
    height: 72,
    barWidth: 3,
    barGap: 3,
    barRadius: 9999,
    interact: false,
  });

  useEffect(() => {
    if (!wavesurfer) return;
    if (isPlaying) {
      wavesurfer.play();
    } else {
      wavesurfer.pause();
    }
  }, [isPlaying, wavesurfer]);

  useEffect(() => {
    if (!wavesurfer) return;
    const handler = (currentTime: number) => onTimeUpdate(Math.floor(currentTime));
    wavesurfer.on("timeupdate", handler);
    return () => { wavesurfer.un("timeupdate", handler); };
  }, [wavesurfer, onTimeUpdate]);

  return <div ref={containerRef} className="flex-1" />;
}

interface TranscriptDetailSheetProps {
  transcript: Transcript | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TranscriptDetailSheet({
  transcript,
  open,
  onOpenChange,
}: TranscriptDetailSheetProps) {
  const [playing, setPlaying] = useState(false);
  const [currentSeconds, setCurrentSeconds] = useState(0);

  const handlePlay = useCallback(() => {
    if (!transcript?.audioUrl) {
      toast.info("Audio not available for this call");
      return;
    }
    setPlaying((p) => !p);
  }, [transcript?.audioUrl]);

  useEffect(() => {
    setPlaying(false);
    setCurrentSeconds(0);
  }, [transcript?.id]);

  if (!transcript) return null;

  const tagStyle = transcript.tag
    ? (TAG_STYLES[transcript.tag] ?? "bg-foreground text-background")
    : null;

  const totalDurationSecs = (() => {
    const match = transcript.duration.match(/(\d+)\s*min.*?(\d+)\s*sec/);
    if (match) return parseInt(match[1]) * 60 + parseInt(match[2]);
    const singleMin = transcript.duration.match(/(\d+)\s*min/);
    if (singleMin) return parseInt(singleMin[1]) * 60;
    return 214;
  })();

  const currentLabel = formatDurationFromSeconds(currentSeconds);
  const totalLabel = formatDurationFromSeconds(totalDurationSecs);

  const formattedDate = transcript.date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="min-w-[600px] max-w-full flex flex-col p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              {transcript.callerNumber}
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
              >
                <MoreHorizontal className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground">
                {transcript.startTime}
              </span>
              <div className="h-[2px] w-10 bg-muted-foreground rounded-full shrink-0" />
              <span className="text-sm text-foreground">
                {transcript.endTime}
              </span>
            </div>
            {transcript.tag && tagStyle && (
              <Badge
                className={`${tagStyle} rounded-full text-xs font-semibold px-2.5 py-0.5 shrink-0 border-0`}
              >
                {transcript.tag}
              </Badge>
            )}
          </div>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 px-5 py-4">
          {/* Waveform player */}
          <div className="border border-border rounded-md flex items-center gap-3 px-3 py-2">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                onClick={handlePlay}
                className="bg-foreground text-background rounded-full size-10 flex items-center justify-center hover:bg-foreground/90 transition-colors"
                aria-label={playing ? "Pause" : "Play"}
              >
                {playing ? (
                  <Pause className="size-4 fill-background" />
                ) : (
                  <Play className="size-4 fill-background" />
                )}
              </button>
              <span className="text-xs font-semibold bg-secondary text-secondary-foreground rounded-lg px-2 py-0.5 whitespace-nowrap">
                {currentLabel} / {totalLabel}
              </span>
            </div>
            {transcript.audioUrl ? (
              <AudioWaveformLarge
                audioUrl={transcript.audioUrl}
                isPlaying={playing}
                onTimeUpdate={setCurrentSeconds}
              />
            ) : (
              <StaticWaveformLarge />
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="transcript" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transcript">Transcript</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  { label: "Date", value: formattedDate },
                  { label: "Duration", value: transcript.duration },
                  {
                    label: "Direction",
                    value: transcript.direction ?? "Inbound",
                  },
                  { label: "Agent", value: transcript.agentName ?? "—" },
                  { label: "Customer ID", value: transcript.customerId ?? "—" },
                  {
                    label: "Cost",
                    value:
                      transcript.cost != null
                        ? `$${transcript.cost.toFixed(4)}`
                        : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Transcript tab */}
            <TabsContent
              value="transcript"
              className="mt-4 flex flex-col gap-3"
            >
              {transcript.messages && transcript.messages.length > 0 ? (
                transcript.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 max-w-[75%] ${
                      msg.role === "agent"
                        ? "self-start items-start"
                        : "self-end items-end"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 text-sm leading-relaxed ${
                        msg.role === "agent"
                          ? "bg-accent text-foreground font-semibold"
                          : "bg-muted/60 text-foreground/80 font-medium"
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[11px] text-muted-foreground px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transcript available for this call.
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
