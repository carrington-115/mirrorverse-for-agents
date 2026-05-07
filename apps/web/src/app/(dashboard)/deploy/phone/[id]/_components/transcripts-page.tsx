"use client";

import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Transcript } from "@/lib/types";
import VoiceTranscriptCard from "./voice-transcript-card";
import EmptyTabState from "./empty-tab-state";
import TranscriptDetailSheet from "./transcript-detail-sheet";

const DATE_OPTIONS = ["All time", "Today", "This week", "This month"];

interface TranscriptsPageProps {
  transcripts: Transcript[];
}

export default function TranscriptsPage({ transcripts }: TranscriptsPageProps) {
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All time");
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    return transcripts.filter((t) => {
      const matchesCaller = t.callerNumber.toLowerCase().includes(search.toLowerCase());

      let matchesDate = true;
      if (dateFilter === "Today") {
        matchesDate = t.date.toDateString() === now.toDateString();
      } else if (dateFilter === "This week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = t.date >= startOfWeek;
      } else if (dateFilter === "This month") {
        matchesDate =
          t.date.getMonth() === now.getMonth() && t.date.getFullYear() === now.getFullYear();
      }

      return matchesCaller && matchesDate;
    });
  }, [transcripts, search, dateFilter]);

  return (
    <div className="gap-4 flex w-full flex-col">
      {/* Toolbar */}
      <div className="gap-3 flex items-center justify-between">
        <div className="relative max-w-[480px] flex-1">
          <Search className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by caller"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
              Filter by date
              {dateFilter !== "All time" && (
                <span className="text-xs font-semibold text-primary">: {dateFilter}</span>
              )}
              <ChevronDown className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {DATE_OPTIONS.map((opt) => (
              <DropdownMenuItem key={opt} onClick={() => setDateFilter(opt)}>
                {opt}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Grid */}
      {transcripts.length === 0 ? (
        <EmptyTabState
          title="No transcripts yet"
          description="Once calls are made and agents respond, transcripts will appear here with full audio and message history."
        />
      ) : filtered.length === 0 ? (
        <div className="py-16 text-sm flex items-center justify-center text-muted-foreground">
          No transcripts match your filters.
        </div>
      ) : (
        <div className="gap-4 grid grid-cols-4">
          {filtered.map((t) => (
            <VoiceTranscriptCard
              key={t.id}
              callerNumber={t.callerNumber}
              tag={t.tag}
              duration={t.duration}
              startTime={t.startTime}
              endTime={t.endTime}
              audioUrl={t.audioUrl}
              onShowTranscript={() => setSelectedTranscript(t)}
            />
          ))}
        </div>
      )}

      <TranscriptDetailSheet
        transcript={selectedTranscript}
        open={!!selectedTranscript}
        onOpenChange={(o) => {
          if (!o) setSelectedTranscript(null);
        }}
      />
    </div>
  );
}
