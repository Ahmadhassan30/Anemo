/*
 * Purpose: Quiz page for a lecture.
 */
import React from "react";

export default function StudentQuizPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-canvas px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm">
        <span className="pill bg-fill text-subtle">Knowledge check</span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">
          Quiz
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-subtle">
          Test your understanding of the lecture.
        </p>
        <p className="mt-6 text-sm text-faint">
          Your quiz will appear here.
        </p>
      </section>
    </main>
  );
}
