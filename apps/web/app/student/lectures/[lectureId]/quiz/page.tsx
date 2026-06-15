/*
 * Purpose: Quiz page for a lecture.
 */
import React from "react";

export default function StudentQuizPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col px-4 py-12 sm:px-6">
      <span className="term-chip mb-6 self-start">
        <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" />
        knowledge_check
      </span>

      <section className="term-window w-full pt-9 glow-ring">
        <div className="absolute right-4 top-3 text-[11px] text-muted-foreground">
          ~/lecture/quiz
        </div>
        <div className="space-y-3 px-6 pb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <span className="term-prompt text-muted-foreground" />
            quiz
            <span className="term-cursor align-middle" aria-hidden />
          </h1>
          <p className="term-caret max-w-xl text-sm leading-relaxed text-muted-foreground">
            test your understanding of the lecture.
          </p>
        </div>
      </section>
    </main>
  );
}
