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
import VoiceTranscriptCard from "./VoiceTranscriptCard";
import EmptyTabState from "./EmptyTabState";
import TranscriptDetailSheet from "./TranscriptDetailSheet";

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
      const matchesCaller = t.callerNumber
        .toLowerCase()
        .includes(search.toLowerCase());

      let matchesDate = true;
      if (dateFilter === "Today") {
        matchesDate = t.date.toDateString() === now.toDateString();
      } else if (dateFilter === "This week") {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        matchesDate = t.date >= startOfWeek;
      } else if (dateFilter === "This month") {
        matchesDate =
          t.date.getMonth() === now.getMonth() &&
          t.date.getFullYear() === now.getFullYear();
      }

      return matchesCaller && matchesDate;
    });
  }, [transcripts, search, dateFilter]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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
                <span className="text-xs font-semibold text-primary">
                  : {dateFilter}
                </span>
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
        <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
          No transcripts match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
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
        onOpenChange={(o) => { if (!o) setSelectedTranscript(null); }}
      />
    </div>
  );
}
