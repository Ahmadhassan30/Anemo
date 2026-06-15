/*
 * Purpose: Professor settings and YouTube OAuth connection.
 */
import React from "react";

export default function ProfessorSettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <header className="mb-8">
        <p className="term-label mb-2">{"// professor"}</p>
        <h1 className="flex items-center text-2xl font-bold tracking-tight text-foreground">
          <span className="term-prompt text-primary" />
          settings
          <span className="term-cursor align-middle" aria-hidden />
        </h1>
        <p className="term-caret mt-3 text-sm leading-relaxed text-muted-foreground">
          connect youtube and manage profile preferences
        </p>
      </header>

      <section className="term-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="term-caret text-sm font-semibold text-foreground">youtube_connection</h2>
          <span className="term-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-term-amber" />
            not_connected
          </span>
        </div>
        <hr className="term-rule mb-4" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          link a youtube account via oauth to publish rendered cuts directly from the pipeline.
        </p>
      </section>
    </main>
  );
}
