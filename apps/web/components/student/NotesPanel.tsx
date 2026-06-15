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
    <div className="flex h-full flex-col border-r border-border bg-card">
      <div className="border-b border-border bg-background/40 px-4 py-3">
        <h3 className="term-caret text-sm font-semibold text-foreground">concepts</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="text-primary">{"// "}</span>
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
                className={`group w-full rounded-sm border px-3 py-2.5 text-left transition-all duration-200 ${
                  isActive
                    ? "border-primary bg-primary/10 text-foreground glow-ring"
                    : "border-border bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                <div className="mb-1.5 flex items-center gap-1.5 font-mono text-xs">
                  <Clock className="h-3 w-3" />
                  <span className={isActive ? "font-semibold text-primary glow-text" : "text-muted-foreground"}>
                    [{formatTime(c.ts_start)}]
                  </span>
                  {isActive && (
                    <span className="term-chip ml-auto border-primary/50 text-primary">
                      <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
                      active
                    </span>
                  )}
                </div>
                <p className={`text-sm font-medium leading-snug ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                  <span className="text-primary">{"› "}</span>
                  {i + 1}. {c.concept}
                </p>
              </button>
            );
          })}
          {concepts.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              <span className="text-primary">$ </span>
              no concepts extracted yet
              <span className="term-cursor" aria-hidden />
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
