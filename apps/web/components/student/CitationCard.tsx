/*
 * Purpose: Display citation with timestamp links.
 */
import React from "react";

export type CitationCardProps = {
  timestamp: string;
  text: string;
};

export function CitationCard({ timestamp, text }: CitationCardProps) {
  return (
    <article>
      <p>{text}</p>
      <small>{timestamp}</small>
    </article>
  );
}
