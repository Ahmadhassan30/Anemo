/*
 * Purpose: Review generated lecture assets before publishing.
 */
import React from "react";

export default function LectureReviewPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <span className="term-chip mb-6">
        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
        review_pending
      </span>

      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        <span className="term-prompt text-muted-foreground" />
        review_lecture
        <span className="term-cursor align-middle" aria-hidden />
      </h1>

      <p className="term-caret mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        inspect animations, notes, and quiz content before publishing.
      </p>

      <hr className="term-rule my-8" />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: "animations", status: "render_ok" },
          { label: "notes", status: "draft" },
          { label: "quiz", status: "draft" },
        ].map((asset) => (
          <div key={asset.label} className="term-card transition-colors hover:border-primary/40">
            <p className="term-label">{"// asset"}</p>
            <h2 className="term-caret mt-2 font-semibold text-foreground">{asset.label}</h2>
            <span className="term-chip mt-4">
              <span className="h-1.5 w-1.5 rounded-full bg-primary/70" />
              {asset.status}
            </span>
          </div>
        ))}
      </section>
    </main>
  );
}
