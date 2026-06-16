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
      ? "bg-green-950 text-green-400 border-green-800"
      : status === "running"
        ? "bg-yellow-950 text-yellow-300 border-yellow-800 animate-pulse"
        : status === "failed"
          ? "bg-red-950 text-red-400 border-red-800"
          : "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <article className="cursor-pointer rounded border border-zinc-800 bg-zinc-900 p-5 transition-all duration-150 hover:-translate-y-px hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <h3 className="truncate font-medium text-zinc-100">{title}</h3>
        <span className={`pill ${pill}`}>{status ?? "unknown"}</span>
      </div>
      <p className="mt-3 text-[10px] uppercase tracking-widest text-zinc-600">lecture</p>
    </article>
  );
}
