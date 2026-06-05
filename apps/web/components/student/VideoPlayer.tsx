/*
 * Purpose: Video player wrapper for lecture content.
 */
import React from "react";

export type VideoPlayerProps = {
  src?: string;
};

export function VideoPlayer({ src }: VideoPlayerProps) {
  return (
    <section>
      <p>Video player placeholder: {src ?? "no source"}</p>
    </section>
  );
}
