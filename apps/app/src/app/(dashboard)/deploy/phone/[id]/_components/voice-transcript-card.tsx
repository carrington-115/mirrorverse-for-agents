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
    6, 14, 22, 18, 30, 36, 28, 20, 32, 40, 38, 34, 26, 18, 10, 24, 36, 30, 20, 12, 6, 14, 22, 18,
    30, 36, 28, 20, 32, 40, 38, 34, 26, 18,
  ];
  return (
    <div className="h-10 flex flex-1 items-center gap-[2px]">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[3px] shrink-0 rounded-full bg-muted-foreground/40"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}

function AudioWaveform({ audioUrl, isPlaying }: { audioUrl: string; isPlaying: boolean }) {
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

  const tagStyle = tag ? (TAG_STYLES[tag] ?? "bg-foreground text-background") : null;

  return (
    <div
      className="px-4 py-3 hover:border-neutral-400 flex w-full cursor-pointer flex-col gap-[18px] rounded-[10px] border border-border bg-background transition-colors"
      onClick={onShowTranscript}
    >
      {/* Top section */}
      <div className="gap-2 flex flex-col">
        {/* Row 1: caller + tag */}
        <div className="gap-2 flex items-center justify-between">
          <span className="text-base font-semibold truncate text-foreground">{callerNumber}</span>
          {tag && tagStyle && (
            <Badge
              className={`${tagStyle} font-semibold px-2 py-0.5 shrink-0 rounded-full border-0 text-[11px]`}
            >
              {tag}
            </Badge>
          )}
        </div>

        {/* Row 2: duration */}
        <div className="gap-1.5 flex items-center">
          <Timer className="size-4 shrink-0 text-foreground" />
          <span className="text-sm text-foreground">{duration}</span>
        </div>

        {/* Row 3: time range */}
        <div className="gap-2 flex items-center justify-between">
          <span className="text-sm text-foreground">{startTime}</span>
          <div className="w-10 h-[2px] shrink-0 rounded-full bg-muted-foreground" />
          <span className="text-sm text-foreground">{endTime}</span>
        </div>
      </div>

      {/* Bottom section */}
      <div className="gap-3 flex flex-col">
        {/* Waveform row */}
        <div className="gap-2 flex items-end">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePlay();
            }}
            className="size-9 flex shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/90"
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
            className="gap-1.5 h-8 text-sm font-medium rounded-full"
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
              <DropdownMenuItem onClick={() => toast.info("Download coming soon")}>
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
