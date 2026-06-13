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
      className="mt-2 p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors group flex flex-col gap-2 rounded-lg"
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 group-hover:text-blue-300">
        <Clock className="w-3.5 h-3.5" />
        {formatTime(ts_start)}
      </div>
      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
        "{chunk_text}"
      </p>
    </Card>
  );
}
