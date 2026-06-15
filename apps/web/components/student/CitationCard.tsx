"use client";

import { useLectureStore } from "@/store/lecture.store";
import { Clock } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CitationCardProps {
  ts_start: number;
  chunk_text: string;
  concept_id: string;
}

export function CitationCard({ ts_start, chunk_text, concept_id }: CitationCardProps) {
  const seekTo = useLectureStore((s) => s.seekTo);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <Card
      onClick={() => seekTo(ts_start)}
      className="term-panel group mt-2 flex cursor-pointer flex-col gap-2 p-3 transition-colors hover:border-primary/50 hover:bg-secondary/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="term-chip border-primary/40 text-primary">
          <Clock className="h-3 w-3" />
          {formatTime(ts_start)}
        </span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors group-hover:text-primary">
          seek<span className="term-cursor align-middle" aria-hidden />
        </span>
      </div>
      <p className="term-caret line-clamp-2 text-xs leading-relaxed text-muted-foreground">
        {chunk_text}
      </p>
    </Card>
  );
}
