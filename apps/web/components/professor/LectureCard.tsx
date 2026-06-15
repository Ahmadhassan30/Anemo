/*
 * Purpose: Summary card for a lecture item.
 */
import React from "react";
import { AgentStatusBadge } from "./AgentStatusBadge";

export type LectureCardProps = {
  title: string;
  status?: string;
  createdAt?: string;
  conceptCount?: number;
};

export function LectureCard({ title, status, createdAt, conceptCount }: LectureCardProps) {
  return (
    <article className="bg-zinc-900 border border-zinc-800 p-5 rounded hover:-translate-y-px hover:border-zinc-700 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-zinc-100 font-medium truncate flex-1">{title}</h3>
        <AgentStatusBadge status={status ?? "pending"} />
      </div>
      {createdAt && (
        <p className="font-mono text-zinc-500 text-xs mt-2">
          {new Date(createdAt).toLocaleDateString()}
        </p>
      )}
      <p className="text-zinc-600 text-xs mt-4">
        {conceptCount ?? 0} concepts
      </p>
    </article>
  );
}
