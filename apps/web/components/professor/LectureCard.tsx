/*
 * Purpose: Summary card for a lecture item.
 */
import React from "react";

export type LectureCardProps = {
  title: string;
  status?: string;
};

export function LectureCard({ title, status }: LectureCardProps) {
  return (
    <article className="term-card transition-colors hover:border-primary/40">
      <div className="mb-3 flex items-center justify-between">
        <span className="term-label">// lecture</span>
        <span className="term-chip">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          {status ?? "unknown"}
        </span>
      </div>
      <h3 className="term-caret text-base font-semibold leading-snug text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-xs text-muted-foreground">
        <span className="text-primary">status</span> :: {status ?? "unknown"}
        <span className="term-cursor" aria-hidden />
      </p>
    </article>
  );
}
