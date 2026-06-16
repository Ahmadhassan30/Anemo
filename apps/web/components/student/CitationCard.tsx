"use client";

import { useLectureStore } from "@/store/lecture.store";
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
      className="group mt-2 flex cursor-pointer flex-col gap-2 rounded-xl border border-line bg-surface p-3 shadow-sm transition-colors duration-200 hover:bg-fill"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-xs text-accent">
          <span aria-hidden>▸</span>
          {formatTime(ts_start)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-faint transition-colors duration-200 group-hover:text-accent">
          seek →
        </span>
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-subtle">
        {chunk_text}
      </p>
    </Card>
  );
}
