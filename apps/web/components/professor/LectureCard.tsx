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
    <article>
      <h3>{title}</h3>
      <p>Status: {status ?? "unknown"}</p>
    </article>
  );
}
