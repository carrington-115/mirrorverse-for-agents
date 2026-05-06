"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useWavesurfer } from "@wavesurfer/react";
import { Timer, Play, Pause, Captions, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const TAG_STYLES: Record<string, string> = {
  "Call escalated": "bg-foreground text-background",
  "Human handoff": "bg-amber-500 text-white",
  Resolved: "bg-green-500 text-white",
};

function StaticWaveform() {
  const bars = [
    6, 14, 22, 18, 30, 36, 28, 20, 32, 40, 38, 34, 26, 18, 10, 24, 36, 30, 20,
    12, 6, 14, 22, 18, 30, 36, 28, 20, 32, 40, 38, 34, 26, 18,
  ];
  return (
    <div className="flex items-center gap-[2px] h-10 flex-1">
      {bars.map((h, i) => (
        <div
          key={i}
          className="bg-muted-foreground/40 rounded-full w-[3px] shrink-0"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function AudioWaveform({
  audioUrl,
  isPlaying,
}: {
  audioUrl: string;
  isPlaying: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { wavesurfer } = useWavesurfer({
    container: containerRef,
    url: audioUrl,
    waveColor: "#d4d4d4",
    progressColor: "#171717",
    height: 40,
    barWidth: 3,
    barGap: 2,
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

  return <div ref={containerRef} className="flex-1" />;
}

interface VoiceTranscriptCardProps {
  callerNumber: string;
  tag?: string;
  duration: string;
  startTime: string;
  endTime: string;
  audioUrl?: string;
  onShowTranscript?: () => void;
}

export default function VoiceTranscriptCard({
  callerNumber,
  tag,
  duration,
  startTime,
  endTime,
  audioUrl,
  onShowTranscript,
}: VoiceTranscriptCardProps) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    if (!audioUrl) {
      toast.info("Audio playback coming soon");
      return;
    }
    setPlaying((p) => !p);
  }, [audioUrl]);

  const tagStyle = tag
    ? (TAG_STYLES[tag] ?? "bg-foreground text-background")
    : null;

  return (
    <div
      className="bg-background border border-border rounded-[10px] flex flex-col gap-[18px] px-4 py-3 w-full cursor-pointer hover:border-neutral-400 transition-colors"
      onClick={onShowTranscript}
    >
      {/* Top section */}
      <div className="flex flex-col gap-2">
        {/* Row 1: caller + tag */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-foreground truncate">
            {callerNumber}
          </span>
          {tag && tagStyle && (
            <Badge
              className={`${tagStyle} rounded-full text-[11px] font-semibold px-2 py-0.5 shrink-0 border-0`}
            >
              {tag}
            </Badge>
          )}
        </div>

        {/* Row 2: duration */}
        <div className="flex items-center gap-1.5">
          <Timer className="size-4 text-foreground shrink-0" />
          <span className="text-sm text-foreground">{duration}</span>
        </div>

        {/* Row 3: time range */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-foreground">{startTime}</span>
          <div className="h-[2px] w-10 bg-muted-foreground rounded-full shrink-0" />
          <span className="text-sm text-foreground">{endTime}</span>
        </div>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col gap-3">
        {/* Waveform row */}
        <div className="flex items-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            className="bg-foreground text-background rounded-full size-9 flex items-center justify-center shrink-0 hover:bg-foreground/90 transition-colors"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <Pause className="size-4 fill-background" />
            ) : (
              <Play className="size-4 fill-background" />
            )}
          </button>
          {audioUrl ? (
            <AudioWaveform audioUrl={audioUrl} isPlaying={playing} />
          ) : (
            <StaticWaveform />
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between">
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full gap-1.5 h-8 text-sm font-medium"
            onClick={(e) => {
              e.stopPropagation();
              if (onShowTranscript) onShowTranscript();
              else toast.info("Transcript viewer coming soon");
            }}
          >
            <Captions className="size-4" />
            Show transcript
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                aria-label="More options"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => toast.info("Download coming soon")}
              >
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Share coming soon")}>
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => toast.info("Delete coming soon")}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
