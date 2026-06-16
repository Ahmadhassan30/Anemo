"use client";

import { useLectureStore } from "@/store/lecture.store";
import { ScrollArea } from "@/components/ui/scroll-area";

export function NotesPanel() {
  const { concepts, activeConcept, seekTo } = useLectureStore();

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-full flex-col border-r border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-zinc-100">Concepts</h3>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          <span className="text-indigo-400">{"// "}</span>
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
                className={`group w-full rounded border px-3 py-2.5 text-left transition-colors duration-150 ${
                  isActive
                    ? "border-zinc-700 bg-indigo-950 text-zinc-100"
                    : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs">
                  <span aria-hidden>⟳</span>
                  <span className={isActive ? "font-semibold text-indigo-400" : "text-zinc-500"}>
                    [{formatTime(c.ts_start)}]
                  </span>
                  {isActive && (
                    <span className="pill ml-auto border-green-800 bg-green-950 text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      active
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium leading-relaxed ${isActive ? "text-zinc-100" : "text-zinc-300"}`}>
                  <span className="text-indigo-400">{"› "}</span>
                  {i + 1}. {c.concept}
                </p>
              </button>
            );
          })}
          {concepts.length === 0 && (
            <p className="py-8 text-center font-mono text-sm text-zinc-500">
              <span className="text-indigo-400">$ </span>
              no concepts extracted yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
