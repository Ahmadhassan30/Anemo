/*
 * Purpose: Summary card for a lecture item.
 */
import React from "react";

export type LectureCardProps = {
  title: string;
  status?: string;
};

export function LectureCard({ title, status }: LectureCardProps) {
  const pill =
    status === "completed"
      ? "bg-positive/10 text-positive"
      : status === "running"
        ? "bg-accent/10 text-accent"
        : status === "failed"
          ? "bg-danger/10 text-danger"
          : "bg-fill text-subtle";

  return (
    <article className="cursor-pointer rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all duration-200 hover:shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate font-medium text-ink">{title}</h3>
        <span className={`pill ${pill}`}>
          {status === "running" && (
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          )}
          {status ?? "unknown"}
        </span>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-faint">lecture</p>
    </article>
  );
}
