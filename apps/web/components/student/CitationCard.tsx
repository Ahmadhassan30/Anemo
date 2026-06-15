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
      className="bg-zinc-900/50 border-zinc-800 group mt-2 flex cursor-pointer flex-col gap-2 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="pill bg-indigo-950 text-indigo-400 border-indigo-900 text-[10px] gap-1 px-1.5 py-0.5">
          <Clock className="h-2.5 w-2.5" />
          {formatTime(ts_start)}
        </span>
        <span className="text-[9px] uppercase tracking-[0.18em] text-zinc-500 transition-colors group-hover:text-indigo-400 font-mono">
          seek
        </span>
      </div>
      <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
        {chunk_text}
      </p>
    </Card>
  );
}

