"use client";

import { useLectureStore } from "@/store/lecture.store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";

export function NotesPanel() {
  const { concepts, activeConcept, seekTo } = useLectureStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full flex-col border-r border-zinc-800 bg-zinc-905">
      <div className="border-b border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <h3 className="text-xs font-semibold text-zinc-350 uppercase tracking-wider font-mono">concepts</h3>
        <p className="mt-1 text-[11px] text-zinc-500">
          {concepts.length} key topics extracted
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-1.5 p-3">
          {concepts.map((c, i) => {
            const isActive = activeConcept === c.id;

            return (
              <button
                key={c.id}
                onClick={() => seekTo(c.ts_start)}
                className={`group w-full rounded border px-3 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? "border-indigo-500 bg-indigo-950/30 text-zinc-200"
                    : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px]">
                  <Clock className="h-3 w-3 text-zinc-500 group-hover:text-zinc-400" />
                  <span className={isActive ? "font-semibold text-indigo-400" : "text-zinc-500"}>
                    [{formatTime(c.ts_start)}]
                  </span>
                  {isActive && (
                    <span className="pill ml-auto border-indigo-800 bg-indigo-950 text-indigo-400 text-[9px]">
                      active
                    </span>
                  )}
                </div>
                <p className={`text-xs font-medium leading-snug ${isActive ? "text-zinc-250" : "text-zinc-400"}`}>
                  {i + 1}. {c.concept}
                </p>
              </button>
            );
          })}
          {concepts.length === 0 && (
            <p className="py-8 text-center text-xs text-zinc-500 font-mono">
              no concepts extracted yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

