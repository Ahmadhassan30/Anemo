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
    <div className="flex h-full flex-col border-r border-line bg-surface">
      <div className="border-b border-line px-5 py-4">
        <h3 className="text-sm font-semibold tracking-tight text-ink">Concepts</h3>
        <p className="mt-1 text-xs text-faint">
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
                className={`group w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200 ${
                  isActive
                    ? "border-accent/30 bg-accent/[0.06] text-ink"
                    : "border-line bg-surface text-subtle hover:bg-fill"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-1.5 text-xs">
                  <span
                    className={`font-mono tabular-nums ${isActive ? "font-semibold text-accent" : "text-faint"}`}
                  >
                    {formatTime(c.ts_start)}
                  </span>
                  {isActive && (
                    <span className="pill ml-auto bg-positive/10 text-positive">
                      <span className="h-1.5 w-1.5 rounded-full bg-positive animate-pulse" />
                      active
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm font-medium leading-relaxed ${isActive ? "text-ink" : "text-subtle"}`}
                >
                  {i + 1}. {c.concept}
                </p>
              </button>
            );
          })}
          {concepts.length === 0 && (
            <p className="py-10 text-center text-sm text-faint">
              No concepts extracted yet
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
