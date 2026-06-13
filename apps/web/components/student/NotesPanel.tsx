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
    <div className="flex flex-col h-full bg-[#0f1117] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <h3 className="font-semibold text-slate-200">Concepts</h3>
        <p className="text-xs text-slate-500">{concepts.length} key topics extracted</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {concepts.map((c, i) => {
            const isActive = activeConcept === c.id;

            return (
              <button
                key={c.id}
                onClick={() => seekTo(c.ts_start)}
                className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                  isActive 
                    ? "bg-blue-500/10 border-blue-500 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.15)]" 
                    : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-mono mb-1.5 opacity-80">
                  <Clock className="w-3 h-3" />
                  <span className={isActive ? "text-blue-400 font-semibold" : ""}>
                    {formatTime(c.ts_start)}
                  </span>
                </div>
                <p className={`text-sm font-medium leading-snug ${isActive ? "text-slate-100" : "text-slate-300"}`}>
                  {i + 1}. {c.concept}
                </p>
              </button>
            );
          })}
          {concepts.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">No concepts extracted yet.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
