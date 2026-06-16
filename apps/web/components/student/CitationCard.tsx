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
      className="group mt-2 flex cursor-pointer flex-col gap-2 rounded border border-zinc-800 bg-zinc-950 p-2.5 transition-colors duration-150 hover:border-zinc-700"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 font-mono text-xs text-zinc-500">
          <span aria-hidden>▸</span>
          {formatTime(ts_start)}
        </span>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 transition-colors duration-150 group-hover:text-zinc-300">
          seek →
        </span>
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
        {chunk_text}
      </p>
    </Card>
  );
}
